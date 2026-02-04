package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.dto.sale.SaleDetailResponse;
import com.codewithshiva.retailpos.dto.sale.SaleItemResponse;
import com.codewithshiva.retailpos.dto.settings.SettingsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.openpdf.text.Document;
import org.openpdf.text.DocumentException;
import org.openpdf.text.Element;
import org.openpdf.text.Font;
import org.openpdf.text.FontFactory;
import org.openpdf.text.PageSize;
import org.openpdf.text.Paragraph;
import org.openpdf.text.Phrase;
import org.openpdf.text.Rectangle;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfWriter;
import org.openpdf.text.pdf.draw.LineSeparator;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private static final DateTimeFormatter DATE_TIME_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    private final SaleService saleService;
    private final SettingsService settingsService;

    public byte[] generateSaleInvoice(Long saleId) {
        SaleDetailResponse sale = saleService.getSaleById(saleId);
        SettingsResponse settings = settingsService.getSettings();

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            addHeader(document, settings);
            addInvoiceMeta(document, sale, settings);
            addItemsTable(document, sale, settings);
            addSummary(document, sale, settings);
            addFooter(document);

            document.close();
            return outputStream.toByteArray();
        } catch (Exception ex) {
            log.error("Failed to generate invoice PDF for sale {}", saleId, ex);
            throw new IllegalStateException("Failed to generate invoice PDF");
        }
    }

    private void addHeader(Document document, SettingsResponse settings) throws DocumentException {
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

        Paragraph title = new Paragraph(safe(settings.getShopName()), titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        if (hasValue(settings.getAddress())) {
            Paragraph address = new Paragraph(settings.getAddress(), normalFont);
            address.setAlignment(Element.ALIGN_CENTER);
            document.add(address);
        }

        String contact = joinNonEmpty(" | ", settings.getPhone(), settings.getEmail());
        if (hasValue(contact)) {
            Paragraph contactLine = new Paragraph(contact, normalFont);
            contactLine.setAlignment(Element.ALIGN_CENTER);
            document.add(contactLine);
        }

        if (hasValue(settings.getGstNumber())) {
            Paragraph gst = new Paragraph("GSTIN: " + settings.getGstNumber(), normalFont);
            gst.setAlignment(Element.ALIGN_CENTER);
            document.add(gst);
        }

        document.add(new Paragraph(" "));
        LineSeparator separator = new LineSeparator();
        separator.setLineColor(new Color(200, 200, 200));
        document.add(separator);
        document.add(new Paragraph(" "));
    }

    private void addInvoiceMeta(Document document, SaleDetailResponse sale, SettingsResponse settings) throws DocumentException {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.2f, 1f});

        PdfPCell left = new PdfPCell();
        left.setBorder(Rectangle.NO_BORDER);
        left.addElement(new Phrase("Invoice: " + safe(sale.getBillNo()), labelFont));
        left.addElement(new Phrase("Date: " + formatDate(sale.getSoldAt()), valueFont));

        PdfPCell right = new PdfPCell();
        right.setBorder(Rectangle.NO_BORDER);
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        right.addElement(new Phrase("Payment Mode: " + safe(sale.getPaymentMode()), valueFont));
        right.addElement(new Phrase("Cashier: " + safe(sale.getCreatedByName()), valueFont));

        table.addCell(left);
        table.addCell(right);

        document.add(table);
        document.add(new Paragraph(" "));

        if (hasValue(sale.getCustomerName()) || hasValue(sale.getCustomerPhone())) {
            PdfPTable customer = new PdfPTable(1);
            customer.setWidthPercentage(100);
            PdfPCell cell = new PdfPCell();
            cell.setBorder(Rectangle.NO_BORDER);
            cell.addElement(new Phrase("Customer Details", labelFont));
            if (hasValue(sale.getCustomerName())) {
                cell.addElement(new Phrase("Name: " + sale.getCustomerName(), valueFont));
            }
            if (hasValue(sale.getCustomerPhone())) {
                cell.addElement(new Phrase("Phone: " + sale.getCustomerPhone(), valueFont));
            }
            customer.addCell(cell);
            document.add(customer);
            document.add(new Paragraph(" "));
        }
    }

    private void addItemsTable(Document document, SaleDetailResponse sale, SettingsResponse settings) throws DocumentException {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
        Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{0.6f, 3.4f, 0.7f, 1.1f, 1.1f, 1.3f});

        addHeaderCell(table, "#", headerFont);
        addHeaderCell(table, "Item", headerFont);
        addHeaderCell(table, "Qty", headerFont);
        addHeaderCell(table, "Unit Price", headerFont);
        addHeaderCell(table, "Tax", headerFont);
        addHeaderCell(table, "Total", headerFont);

        BigDecimal taxPercent = defaultZero(sale.getTaxPercent());
        BigDecimal discountPercent = defaultZero(sale.getDiscountPercent());

        int index = 1;
        for (SaleItemResponse item : sale.getItems()) {
            BigDecimal lineTotal = defaultZero(item.getUnitPrice())
                    .multiply(BigDecimal.valueOf(item.getQty() == null ? 0 : item.getQty()));
            BigDecimal lineDiscount = lineTotal.multiply(discountPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal taxable = lineTotal.subtract(lineDiscount);
            BigDecimal lineTax = taxable.multiply(taxPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineGrand = taxable.add(lineTax);

            addBodyCell(table, String.valueOf(index++), bodyFont, Element.ALIGN_CENTER);
            addBodyCell(table, formatItemName(item), bodyFont, Element.ALIGN_LEFT);
            addBodyCell(table, String.valueOf(item.getQty()), bodyFont, Element.ALIGN_CENTER);
            addBodyCell(table, formatMoney(item.getUnitPrice(), settings.getCurrency()), bodyFont, Element.ALIGN_RIGHT);
            addBodyCell(table, formatMoney(lineTax, settings.getCurrency()), bodyFont, Element.ALIGN_RIGHT);
            addBodyCell(table, formatMoney(lineGrand, settings.getCurrency()), bodyFont, Element.ALIGN_RIGHT);
        }

        document.add(table);
        document.add(new Paragraph(" "));
    }

    private void addSummary(Document document, SaleDetailResponse sale, SettingsResponse settings) throws DocumentException {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(45);
        table.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.setWidths(new float[]{1.2f, 1f});

        addSummaryRow(table, "Subtotal", formatMoney(sale.getSubtotal(), settings.getCurrency()), labelFont, valueFont);
        if (defaultZero(sale.getDiscountAmount()).compareTo(BigDecimal.ZERO) > 0) {
            addSummaryRow(
                    table,
                    "Discount (" + defaultZero(sale.getDiscountPercent()).setScale(2, RoundingMode.HALF_UP) + "%)",
                    "-" + formatMoney(sale.getDiscountAmount(), settings.getCurrency()),
                    labelFont,
                    valueFont
            );
        }
        addSummaryRow(table, "Tax", formatMoney(sale.getTaxAmount(), settings.getCurrency()), labelFont, valueFont);

        PdfPCell spacerLeft = new PdfPCell(new Phrase("Grand Total", labelFont));
        spacerLeft.setBorder(Rectangle.TOP);
        spacerLeft.setPaddingTop(6);
        PdfPCell spacerRight = new PdfPCell(new Phrase(formatMoney(sale.getTotal(), settings.getCurrency()), labelFont));
        spacerRight.setBorder(Rectangle.TOP);
        spacerRight.setHorizontalAlignment(Element.ALIGN_RIGHT);
        spacerRight.setPaddingTop(6);
        table.addCell(spacerLeft);
        table.addCell(spacerRight);

        document.add(table);
        document.add(new Paragraph(" "));
    }

    private void addFooter(Document document) throws DocumentException {
        Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        Paragraph footer = new Paragraph("Thank you for shopping with us.", footerFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);
    }

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(new Color(240, 240, 240));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text, Font font, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(align);
        cell.setPadding(5);
        table.addCell(cell);
    }

    private void addSummaryRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell left = new PdfPCell(new Phrase(label, labelFont));
        left.setBorder(Rectangle.NO_BORDER);
        PdfPCell right = new PdfPCell(new Phrase(value, valueFont));
        right.setBorder(Rectangle.NO_BORDER);
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(left);
        table.addCell(right);
    }

    private String formatItemName(SaleItemResponse item) {
        String name = safe(item.getProductName());
        String size = item.getSize();
        String color = item.getColor();
        String variantDetails = joinNonEmpty(" | ", size, color);
        if (hasValue(variantDetails)) {
            return name + " (" + variantDetails + ")";
        }
        return name;
    }

    private String formatDate(java.time.OffsetDateTime dateTime) {
        if (dateTime == null) {
            return "-";
        }
        return dateTime.atZoneSameInstant(ZoneId.systemDefault()).format(DATE_TIME_FORMAT);
    }

    private String formatMoney(BigDecimal value, String currency) {
        BigDecimal safeValue = defaultZero(value).setScale(2, RoundingMode.HALF_UP);
        String currencyCode = hasValue(currency) ? currency : "INR";
        return String.format(Locale.US, "%s %s", currencyCode, safeValue.toPlainString());
    }

    private String joinNonEmpty(String delimiter, String first, String second) {
        String left = safe(first);
        String right = safe(second);
        if (hasValue(left) && hasValue(right)) {
            return left + delimiter + right;
        }
        if (hasValue(left)) {
            return left;
        }
        if (hasValue(right)) {
            return right;
        }
        return "";
    }

    private String safe(String value) {
        return hasValue(value) ? value : "-";
    }

    private boolean hasValue(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private BigDecimal defaultZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
