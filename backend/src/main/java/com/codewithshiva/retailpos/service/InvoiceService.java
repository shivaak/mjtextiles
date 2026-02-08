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
            Document document = new Document(PageSize.A4, 30, 30, 30, 30);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            // Add decorative border
            addDocumentBorder(document);
            
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
    
    private void addDocumentBorder(Document document) throws DocumentException {
        // Simplified border - just a thin line at the top
        LineSeparator topLine = new LineSeparator();
        topLine.setLineColor(new Color(100, 100, 100));
        topLine.setLineWidth(0.5f);
        document.add(topLine);
        document.add(new Paragraph(" "));
    }

    private void addHeader(Document document, SettingsResponse settings) throws DocumentException {
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new Color(25, 25, 112)); // Midnight blue
        Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(60, 60, 60));
        Font invoiceFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(25, 25, 112));

        // Shop name
        Paragraph title = new Paragraph(safe(settings.getShopName()), titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        if (hasValue(settings.getAddress())) {
            Paragraph address = new Paragraph(settings.getAddress(), subtitleFont);
            address.setAlignment(Element.ALIGN_CENTER);
            document.add(address);
        }

        String contact = joinNonEmpty(" | ", settings.getPhone(), settings.getEmail());
        if (hasValue(contact)) {
            Paragraph contactLine = new Paragraph(contact, subtitleFont);
            contactLine.setAlignment(Element.ALIGN_CENTER);
            document.add(contactLine);
        }

        if (hasValue(settings.getGstNumber())) {
            Paragraph gst = new Paragraph("GSTIN: " + settings.getGstNumber(), subtitleFont);
            gst.setAlignment(Element.ALIGN_CENTER);
            document.add(gst);
        }

        document.add(new Paragraph(" "));
        
        // Add "TAX INVOICE" label
        Paragraph invoiceLabel = new Paragraph("TAX INVOICE", invoiceFont);
        invoiceLabel.setAlignment(Element.ALIGN_CENTER);
        document.add(invoiceLabel);
        
        document.add(new Paragraph(" "));
        LineSeparator separator = new LineSeparator();
        separator.setLineColor(new Color(100, 100, 100));
        separator.setLineWidth(1);
        document.add(separator);
        document.add(new Paragraph(" "));
    }

    private void addInvoiceMeta(Document document, SaleDetailResponse sale, SettingsResponse settings) throws DocumentException {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

        // Create a 2-column layout for Invoice Details and Customer Details side by side
        PdfPTable mainTable = new PdfPTable(2);
        mainTable.setWidthPercentage(100);
        mainTable.setWidths(new float[]{1f, 1f});

        // Left side - Invoice Details
        PdfPCell invoiceCell = new PdfPCell();
        invoiceCell.setBorder(Rectangle.BOX);
        invoiceCell.setBorderColor(new Color(150, 150, 150));
        invoiceCell.setPadding(10);
        invoiceCell.addElement(new Phrase("Invoice Details", labelFont));
        invoiceCell.addElement(new Phrase(" ", valueFont)); // spacer
        invoiceCell.addElement(new Phrase("Invoice No: " + safe(sale.getBillNo()), valueFont));
        invoiceCell.addElement(new Phrase("Date: " + formatDate(sale.getSoldAt()), valueFont));
        invoiceCell.addElement(new Phrase("Payment: " + safe(sale.getPaymentMode()), valueFont));
        invoiceCell.addElement(new Phrase("Cashier: " + safe(sale.getCreatedByName()), valueFont));

        // Right side - Customer Details (Billed To)
        PdfPCell customerCell = new PdfPCell();
        customerCell.setBorder(Rectangle.BOX);
        customerCell.setBorderColor(new Color(150, 150, 150));
        customerCell.setPadding(10);
        customerCell.addElement(new Phrase("Billed To", labelFont));
        customerCell.addElement(new Phrase(" ", valueFont)); // spacer
        
        if (hasValue(sale.getCustomerName()) || hasValue(sale.getCustomerPhone())) {
            String customerName = hasValue(sale.getCustomerName()) ? sale.getCustomerName() : "N/A";
            String customerPhone = hasValue(sale.getCustomerPhone()) ? sale.getCustomerPhone() : "N/A";
            customerCell.addElement(new Phrase("Name: " + customerName, valueFont));
            customerCell.addElement(new Phrase("Phone: " + customerPhone, valueFont));
        } else {
            customerCell.addElement(new Phrase("Walk-in Customer", valueFont));
        }

        mainTable.addCell(invoiceCell);
        mainTable.addCell(customerCell);

        document.add(mainTable);
        document.add(new Paragraph(" "));
    }

    private void addItemsTable(Document document, SaleDetailResponse sale, SettingsResponse settings) throws DocumentException {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
        Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

        BigDecimal taxPercent = defaultZero(sale.getTaxPercent());
        BigDecimal taxDivisor = BigDecimal.ONE.add(taxPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));

        // Check if any item has a discount
        boolean hasAnyDiscount = sale.getItems().stream()
                .anyMatch(item -> defaultZero(item.getItemDiscountPercent()).compareTo(BigDecimal.ZERO) > 0);

        PdfPTable table;
        if (hasAnyDiscount) {
            table = new PdfPTable(9);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{0.4f, 2.3f, 0.7f, 0.5f, 0.8f, 0.6f, 1.0f, 0.8f, 1.0f});
        } else {
            table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{0.4f, 2.5f, 0.8f, 0.5f, 0.8f, 1.0f, 0.8f, 1.0f});
        }

        addHeaderCell(table, "#", headerFont);
        addHeaderCell(table, "Item Description", headerFont);
        addHeaderCell(table, "HSN", headerFont);
        addHeaderCell(table, "Qty", headerFont);
        addHeaderCell(table, "Rate (Incl GST)", headerFont);
        if (hasAnyDiscount) {
            addHeaderCell(table, "Disc", headerFont);
        }
        addHeaderCell(table, "Taxable Value", headerFont);
        String gstHeader = "GST (" + defaultZero(sale.getTaxPercent()).stripTrailingZeros().toPlainString() + "%)";
        addHeaderCell(table, gstHeader, headerFont);
        addHeaderCell(table, "Amount", headerFont);

        int index = 1;
        for (SaleItemResponse item : sale.getItems()) {
            // Apply item-level discount to unit price (MRP, tax-inclusive)
            BigDecimal itemDiscountPct = defaultZero(item.getItemDiscountPercent());
            BigDecimal itemDiscountFactor = BigDecimal.ONE.subtract(itemDiscountPct.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            BigDecimal effectiveUnitPrice = defaultZero(item.getUnitPrice()).multiply(itemDiscountFactor).setScale(2, RoundingMode.HALF_UP);
            int qty = item.getQty() == null ? 0 : item.getQty();
            BigDecimal lineAmount = effectiveUnitPrice.multiply(BigDecimal.valueOf(qty));
            // Extract taxable value and GST from line amount
            BigDecimal lineTaxableValue = lineAmount.divide(taxDivisor, 2, RoundingMode.HALF_UP);
            BigDecimal lineGst = lineAmount.subtract(lineTaxableValue);

            String itemName = formatItemName(item);

            addBodyCell(table, String.valueOf(index++), bodyFont, Element.ALIGN_CENTER);
            addBodyCell(table, itemName, bodyFont, Element.ALIGN_LEFT);
            addBodyCell(table, safe(item.getProductHsn()), bodyFont, Element.ALIGN_CENTER);
            addBodyCell(table, String.valueOf(qty), bodyFont, Element.ALIGN_CENTER);
            addBodyCell(table, formatMoney(defaultZero(item.getUnitPrice()), settings.getCurrency()), bodyFont, Element.ALIGN_RIGHT);
            if (hasAnyDiscount) {
                String discountDisplay = itemDiscountPct.compareTo(BigDecimal.ZERO) > 0
                        ? itemDiscountPct.stripTrailingZeros().toPlainString() + "%"
                        : "-";
                addBodyCell(table, discountDisplay, bodyFont, Element.ALIGN_CENTER);
            }
            addBodyCell(table, formatMoney(lineTaxableValue, settings.getCurrency()), bodyFont, Element.ALIGN_RIGHT);
            addBodyCell(table, formatMoney(lineGst, settings.getCurrency()), bodyFont, Element.ALIGN_RIGHT);
            addBodyCell(table, formatMoney(lineAmount, settings.getCurrency()), bodyFont, Element.ALIGN_RIGHT);
        }

        document.add(table);
        document.add(new Paragraph(" "));
    }

    private void addSummary(Document document, SaleDetailResponse sale, SettingsResponse settings) throws DocumentException {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Font grandTotalFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(50);
        table.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.setWidths(new float[]{1.5f, 1f});

        // Taxable value = subtotal - tax amount (since subtotal is tax-inclusive)
        BigDecimal taxableValue = defaultZero(sale.getSubtotal()).subtract(defaultZero(sale.getTaxAmount()));
        addSummaryRow(table, "Total Taxable Value", formatMoney(taxableValue, settings.getCurrency()), labelFont, valueFont);
        addSummaryRow(table, "Total GST (" + defaultZero(sale.getTaxPercent()).stripTrailingZeros().toPlainString() + "%)", 
                     formatMoney(sale.getTaxAmount(), settings.getCurrency()), labelFont, valueFont);
        addSummaryRow(table, "Subtotal", formatMoney(sale.getSubtotal(), settings.getCurrency()), labelFont, valueFont);
        if (defaultZero(sale.getDiscountAmount()).compareTo(BigDecimal.ZERO) > 0) {
            addSummaryRow(
                    table,
                    "Addl. Discount (" + defaultZero(sale.getDiscountPercent()).setScale(2, RoundingMode.HALF_UP) + "%)",
                    "-" + formatMoney(sale.getDiscountAmount(), settings.getCurrency()),
                    labelFont,
                    valueFont
            );
        }

        PdfPCell spacerLeft = new PdfPCell(new Phrase("Final Amount", grandTotalFont));
        spacerLeft.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
        spacerLeft.setBorderWidth(1.5f);
        spacerLeft.setBorderColor(new Color(100, 100, 100));
        spacerLeft.setPaddingTop(8);
        spacerLeft.setPaddingBottom(8);
        spacerLeft.setPaddingLeft(5);
        
        PdfPCell spacerRight = new PdfPCell(new Phrase(formatMoney(sale.getTotal(), settings.getCurrency()), grandTotalFont));
        spacerRight.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
        spacerRight.setBorderWidth(1.5f);
        spacerRight.setBorderColor(new Color(100, 100, 100));
        spacerRight.setHorizontalAlignment(Element.ALIGN_RIGHT);
        spacerRight.setPaddingTop(8);
        spacerRight.setPaddingBottom(8);
        spacerRight.setPaddingRight(5);
        
        table.addCell(spacerLeft);
        table.addCell(spacerRight);

        document.add(table);
        document.add(new Paragraph(" "));
    }

    private void addFooter(Document document) throws DocumentException {
        document.add(new Paragraph(" "));
        
        LineSeparator separator = new LineSeparator();
        separator.setLineColor(new Color(150, 150, 150));
        separator.setLineWidth(0.5f);
        document.add(separator);
        
        document.add(new Paragraph(" "));
        
        Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font noteFont = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(100, 100, 100));
        
        Paragraph thankYou = new Paragraph("Thank you for your business!", footerFont);
        thankYou.setAlignment(Element.ALIGN_CENTER);
        document.add(thankYou);
        
        Paragraph note = new Paragraph("This is a computer generated invoice", noteFont);
        note.setAlignment(Element.ALIGN_CENTER);
        document.add(note);
    }

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(6);
        cell.setBorderWidth(1);
        cell.setBorderColor(new Color(100, 100, 100));
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text, Font font, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(5);
        cell.setBorderColor(new Color(180, 180, 180));
        cell.setBorderWidth(0.5f);
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
