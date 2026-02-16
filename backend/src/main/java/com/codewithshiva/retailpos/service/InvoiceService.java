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
import org.openpdf.text.pdf.BaseFont;
import org.openpdf.text.pdf.PdfContentByte;
import org.openpdf.text.pdf.PdfGState;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfPageEventHelper;
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
    private static final Rectangle INVOICE_PAGE_SIZE = PageSize.A5;
    private static final float PAGE_MARGIN = 20f;
    private static final float PAGE_BORDER_OFFSET = 8f;
    private static final int ITEM_TABLE_HEADER_FONT_SIZE = 8;
    private static final int ITEM_TABLE_BODY_FONT_SIZE = 8;
    private static final float ITEM_TABLE_CELL_PADDING = 4f;
    private static final float SECTION_SPACER = 2f;

    private final SaleService saleService;
    private final SettingsService settingsService;

    public byte[] generateSaleInvoice(Long saleId) {
        SaleDetailResponse sale = saleService.getSaleById(saleId);
        SettingsResponse settings = settingsService.getSettings();

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(INVOICE_PAGE_SIZE, PAGE_MARGIN, PAGE_MARGIN, PAGE_MARGIN, PAGE_MARGIN);
            PdfWriter writer = PdfWriter.getInstance(document, outputStream);

            boolean isVoided = "VOIDED".equalsIgnoreCase(sale.getStatus());

            // Add full-page border box (and VOIDED watermark if applicable) via page event
            writer.setPageEvent(new PdfPageEventHelper() {
                @Override
                public void onEndPage(PdfWriter w, Document doc) {
                    PdfContentByte cb = w.getDirectContent();

                    // Page border
                    cb.setLineWidth(1.5f);
                    cb.setColorStroke(new Color(80, 80, 80));
                    cb.rectangle(
                            doc.left() - PAGE_BORDER_OFFSET, doc.bottom() - PAGE_BORDER_OFFSET,
                            doc.getPageSize().getWidth() - doc.leftMargin() - doc.rightMargin() + (PAGE_BORDER_OFFSET * 2),
                            doc.getPageSize().getHeight() - doc.topMargin() - doc.bottomMargin() + (PAGE_BORDER_OFFSET * 2)
                    );
                    cb.stroke();

                    // VOIDED watermark
                    if (isVoided) {
                        try {
                            cb.saveState();
                            PdfGState gs = new PdfGState();
                            gs.setFillOpacity(0.12f);
                            cb.setGState(gs);
                            cb.setColorFill(new Color(255, 0, 0));
                            cb.beginText();
                            BaseFont bf = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
                            cb.setFontAndSize(bf, 90);
                            cb.showTextAligned(Element.ALIGN_CENTER, "VOIDED",
                                    doc.getPageSize().getWidth() / 2,
                                    doc.getPageSize().getHeight() / 2, 45);
                            cb.endText();
                            cb.restoreState();
                        } catch (Exception ignored) {
                            // Font creation won't fail for built-in fonts
                        }
                    }
                }
            });

            document.open();

            addHeader(document, settings);
            addInvoiceMeta(document, sale, settings);
            addItemsTable(document, sale, settings);
            addSummary(document, sale, settings);
            addFooter(document, settings);

            document.close();
            return outputStream.toByteArray();
        } catch (Exception ex) {
            log.error("Failed to generate invoice PDF for sale {}", saleId, ex);
            throw new IllegalStateException("Failed to generate invoice PDF");
        }
    }
    
    private void addHeader(Document document, SettingsResponse settings) throws DocumentException {
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(25, 25, 112)); // Midnight blue
        Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(60, 60, 60));
        Font invoiceFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(25, 25, 112));

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

        addSpacer(document);
        
        // Add "TAX INVOICE" label
        Paragraph invoiceLabel = new Paragraph("TAX INVOICE", invoiceFont);
        invoiceLabel.setAlignment(Element.ALIGN_CENTER);
        document.add(invoiceLabel);
        
        addSpacer(document);
        LineSeparator separator = new LineSeparator();
        separator.setLineColor(new Color(100, 100, 100));
        separator.setLineWidth(1);
        document.add(separator);
        addSpacer(document);
    }

    private void addInvoiceMeta(Document document, SaleDetailResponse sale, SettingsResponse settings) throws DocumentException {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 9);

        // Create a 2-column layout for Invoice Details and Customer Details side by side
        PdfPTable mainTable = new PdfPTable(2);
        mainTable.setWidthPercentage(100);
        mainTable.setWidths(new float[]{1f, 1f});

        // Left side - Invoice Details
        PdfPCell invoiceCell = new PdfPCell();
        invoiceCell.setBorder(Rectangle.BOX);
        invoiceCell.setBorderColor(new Color(150, 150, 150));
        invoiceCell.setPadding(5);
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
        customerCell.setPadding(5);
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
        addSpacer(document);
    }

    private void addItemsTable(Document document, SaleDetailResponse sale, SettingsResponse settings) throws DocumentException {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, ITEM_TABLE_HEADER_FONT_SIZE);
        Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, ITEM_TABLE_BODY_FONT_SIZE);

        BigDecimal taxPercent = defaultZero(sale.getTaxPercent());
        BigDecimal taxDivisor = BigDecimal.ONE.add(taxPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));

        // Check if any item has a discount
        boolean hasAnyDiscount = sale.getItems().stream()
                .anyMatch(item -> defaultZero(item.getItemDiscountPercent()).compareTo(BigDecimal.ZERO) > 0);

        PdfPTable table;
        if (hasAnyDiscount) {
            table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{0.5f, 2.3f, 0.7f, 0.6f, 1.1f, 1.1f, 0.7f, 1.2f});
        } else {
            table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{0.5f, 2.4f, 0.8f, 0.6f, 1.2f, 1.2f, 1.3f});
        }

        addHeaderCell(table, "#", headerFont);
        addHeaderCell(table, "Item Description", headerFont);
        addHeaderCell(table, "HSN", headerFont);
        addHeaderCell(table, "Qty", headerFont);
        addHeaderCell(table, "Rate (Incl GST)", headerFont);
        addHeaderCell(table, "Taxable Value", headerFont);
        if (hasAnyDiscount) {
            addHeaderCell(table, "Disc", headerFont);
        }
        addHeaderCell(table, "Amount", headerFont);

        int index = 1;
        for (SaleItemResponse item : sale.getItems()) {
            // Compute taxable value first, then apply item-level discount on taxable amount.
            BigDecimal itemDiscountPct = defaultZero(item.getItemDiscountPercent());
            int qty = item.getQty() == null ? 0 : item.getQty();
            BigDecimal lineAmountInclTax = defaultZero(item.getUnitPrice()).multiply(BigDecimal.valueOf(qty));
            BigDecimal lineTaxableValue = lineAmountInclTax.divide(taxDivisor, 2, RoundingMode.HALF_UP);
            BigDecimal itemDiscountAmount = lineTaxableValue
                    .multiply(itemDiscountPct)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineAmount = lineTaxableValue.subtract(itemDiscountAmount);

            String itemName = formatItemName(item);

            addBodyCell(table, String.valueOf(index++), bodyFont, Element.ALIGN_CENTER);
            addBodyCell(table, itemName, bodyFont, Element.ALIGN_LEFT);
            addBodyCell(table, safe(item.getProductHsn()), bodyFont, Element.ALIGN_CENTER);
            addBodyCell(table, String.valueOf(qty), bodyFont, Element.ALIGN_CENTER);
            addBodyCell(table, formatMoney(defaultZero(item.getUnitPrice()), settings.getCurrency()), bodyFont, Element.ALIGN_RIGHT);
            addBodyCell(table, formatMoney(lineTaxableValue, settings.getCurrency()), bodyFont, Element.ALIGN_RIGHT);
            if (hasAnyDiscount) {
                String discountDisplay = itemDiscountPct.compareTo(BigDecimal.ZERO) > 0
                        ? itemDiscountPct.stripTrailingZeros().toPlainString() + "%"
                        : "-";
                addBodyCell(table, discountDisplay, bodyFont, Element.ALIGN_CENTER);
            }
            addBodyCell(table, formatMoney(lineAmount, settings.getCurrency()), bodyFont, Element.ALIGN_RIGHT);
        }

        document.add(table);
        addSpacer(document);
    }

    private void addSummary(Document document, SaleDetailResponse sale, SettingsResponse settings) throws DocumentException {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        Font grandTotalFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font pointsFont = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(0, 128, 0));

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(56);
        table.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.setWidths(new float[]{1.5f, 1f});

        // Summary is aligned with item table:
        // Amount column = Taxable Value - Item Discount.
        BigDecimal taxPercent = defaultZero(sale.getTaxPercent());
        BigDecimal taxDivisor = BigDecimal.ONE.add(taxPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        BigDecimal subtotal = BigDecimal.ZERO;

        for (SaleItemResponse item : sale.getItems()) {
            int qty = item.getQty() == null ? 0 : item.getQty();
            BigDecimal lineAmountInclTax = defaultZero(item.getUnitPrice()).multiply(BigDecimal.valueOf(qty));
            BigDecimal lineTaxableValue = lineAmountInclTax.divide(taxDivisor, 2, RoundingMode.HALF_UP);
            BigDecimal lineItemDiscount = lineTaxableValue
                    .multiply(defaultZero(item.getItemDiscountPercent()))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineAmount = lineTaxableValue.subtract(lineItemDiscount);
            subtotal = subtotal.add(lineAmount);
        }

        BigDecimal taxableValue = subtotal.setScale(2, RoundingMode.HALF_UP);
        BigDecimal discountAmount = defaultZero(sale.getDiscountAmount());
        BigDecimal taxAmount = taxableValue
                .multiply(taxPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal cgstAmount = taxAmount.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal sgstAmount = taxAmount.subtract(cgstAmount);
        BigDecimal halfTaxPercent = taxPercent.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);

        // Subtotal is the sum of item Amount column values.
        addSummaryRow(table, "Subtotal", formatMoney(taxableValue, settings.getCurrency()), labelFont, valueFont);
        addDividerRow(table);
        addSummaryRow(table, "CGST (" + halfTaxPercent.stripTrailingZeros().toPlainString() + "%)",
                formatMoney(cgstAmount, settings.getCurrency()), labelFont, valueFont);
        addSummaryRow(table, "SGST (" + halfTaxPercent.stripTrailingZeros().toPlainString() + "%)",
                formatMoney(sgstAmount, settings.getCurrency()), labelFont, valueFont);
        if (discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            addSummaryRow(
                    table,
                    "Addl. Discount (Post Tax)",
                    "-" + formatMoney(discountAmount, settings.getCurrency()),
                    labelFont,
                    valueFont
            );
        }
        addDividerRow(table);

        // Points redemption deduction
        BigDecimal pointsRedemptionAmount = defaultZero(sale.getPointsRedemptionAmount());
        if (pointsRedemptionAmount.compareTo(BigDecimal.ZERO) > 0) {
            int pointsRedeemed = sale.getPointsRedeemed() != null ? sale.getPointsRedeemed() : 0;
            addSummaryRow(
                    table,
                    "Points Redeemed (" + pointsRedeemed + " pts)",
                    "-" + formatMoney(pointsRedemptionAmount, settings.getCurrency()),
                    labelFont,
                    valueFont
            );
        }

        // Net payable = taxable + GST - post-tax deductions
        BigDecimal total = taxableValue.add(taxAmount);
        BigDecimal netPayable = total.subtract(discountAmount).subtract(pointsRedemptionAmount);
        BigDecimal roundedTotal = netPayable.setScale(0, RoundingMode.HALF_UP);
        BigDecimal roundOff = roundedTotal.subtract(netPayable);

        if (roundOff.compareTo(BigDecimal.ZERO) != 0) {
            String roundOffDisplay = (roundOff.compareTo(BigDecimal.ZERO) > 0 ? "+" : "")
                    + formatMoney(roundOff, settings.getCurrency());
            addSummaryRow(table, "Round Off", roundOffDisplay, labelFont, valueFont);
        }

        PdfPCell spacerLeft = new PdfPCell(new Phrase("Net Payable", grandTotalFont));
        spacerLeft.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
        spacerLeft.setBorderWidth(1.5f);
        spacerLeft.setBorderColor(new Color(100, 100, 100));
        spacerLeft.setPaddingTop(6);
        spacerLeft.setPaddingBottom(6);
        spacerLeft.setPaddingLeft(5);
        
        PdfPCell spacerRight = new PdfPCell(new Phrase(formatMoney(roundedTotal, settings.getCurrency()), grandTotalFont));
        spacerRight.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
        spacerRight.setBorderWidth(1.5f);
        spacerRight.setBorderColor(new Color(100, 100, 100));
        spacerRight.setHorizontalAlignment(Element.ALIGN_RIGHT);
        spacerRight.setPaddingTop(6);
        spacerRight.setPaddingBottom(6);
        spacerRight.setPaddingRight(5);
        
        table.addCell(spacerLeft);
        table.addCell(spacerRight);

        document.add(table);

        // Points earned note
        int pointsEarned = sale.getPointsEarned() != null ? sale.getPointsEarned() : 0;
        if (pointsEarned > 0) {
            addSpacer(document);
            Paragraph pointsNote = new Paragraph(
                    "You earned " + pointsEarned + " loyalty points on this purchase!",
                    pointsFont
            );
            pointsNote.setAlignment(Element.ALIGN_RIGHT);
            document.add(pointsNote);
        }

        // Amount in words (using rounded net payable)
        addSpacer(document);
        Font amountWordsFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7);
        Paragraph amountInWords = new Paragraph(
                "Amount in Words: " + convertAmountToWords(roundedTotal),
                amountWordsFont
        );
        amountInWords.setAlignment(Element.ALIGN_LEFT);
        document.add(amountInWords);
        addSpacer(document);
    }

    private void addFooter(Document document, SettingsResponse settings) throws DocumentException {
        addSpacer(document);

        // Authorized Signatory - right aligned
        Font signatoryFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
        Font signatoryLabelFont = FontFactory.getFont(FontFactory.HELVETICA, 7);

        PdfPTable sigTable = new PdfPTable(1);
        sigTable.setWidthPercentage(35);
        sigTable.setHorizontalAlignment(Element.ALIGN_RIGHT);

        PdfPCell forCell = new PdfPCell(new Phrase("For " + safe(settings.getShopName()), signatoryFont));
        forCell.setBorder(Rectangle.NO_BORDER);
        forCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        forCell.setPaddingBottom(18); // Leave writing space above signatory label
        sigTable.addCell(forCell);

        PdfPCell authCell = new PdfPCell(new Phrase("Authorized Signatory", signatoryLabelFont));
        authCell.setBorder(Rectangle.NO_BORDER);
        authCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        authCell.setPaddingTop(2);
        sigTable.addCell(authCell);

        document.add(sigTable);

        addSpacer(document);

        LineSeparator separator = new LineSeparator();
        separator.setLineColor(new Color(150, 150, 150));
        separator.setLineWidth(0.5f);
        document.add(separator);

        addSpacer(document);

        Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
        Font noteFont = FontFactory.getFont(FontFactory.HELVETICA, 7, new Color(100, 100, 100));

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
        cell.setPadding(ITEM_TABLE_CELL_PADDING);
        cell.setBorderWidth(1);
        cell.setBorderColor(new Color(100, 100, 100));
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text, Font font, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(ITEM_TABLE_CELL_PADDING);
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

    private void addDividerRow(PdfPTable table) {
        PdfPCell left = new PdfPCell(new Phrase(""));
        left.setBorder(Rectangle.TOP);
        left.setBorderWidthTop(0.8f);
        left.setBorderColor(new Color(200, 200, 200));
        left.setPaddingTop(6);
        left.setPaddingBottom(4);
        left.setPaddingLeft(0);

        PdfPCell right = new PdfPCell(new Phrase(""));
        right.setBorder(Rectangle.TOP);
        right.setBorderWidthTop(0.8f);
        right.setBorderColor(new Color(200, 200, 200));
        right.setPaddingTop(6);
        right.setPaddingBottom(4);
        right.setPaddingRight(0);

        table.addCell(left);
        table.addCell(right);
    }

    private void addSpacer(Document document) throws DocumentException {
        Paragraph spacer = new Paragraph(" ");
        spacer.setLeading(SECTION_SPACER);
        document.add(spacer);
    }

    private String formatItemName(SaleItemResponse item) {
        String name = safe(item.getProductName());
        String sku = item.getVariantBarcode();
        if (hasValue(sku)) {
            return name + " (" + sku + ")";
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

    // ── Amount-to-words conversion (Indian numbering system) ──

    private String convertAmountToWords(BigDecimal amount) {
        long rupees = amount.setScale(2, RoundingMode.HALF_UP).longValue();
        int paise = amount.remainder(BigDecimal.ONE)
                .movePointRight(2)
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();

        StringBuilder sb = new StringBuilder("Rupees ");
        sb.append(convertNumberToWords(rupees));
        if (paise > 0) {
            sb.append(" and ");
            sb.append(convertNumberToWords(paise));
            sb.append(" Paise");
        }
        sb.append(" Only");
        return sb.toString();
    }

    private String convertNumberToWords(long number) {
        if (number == 0) return "Zero";

        String[] ones = {
                "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
                "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
                "Seventeen", "Eighteen", "Nineteen"
        };
        String[] tens = {
                "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
        };

        StringBuilder result = new StringBuilder();

        if (number >= 10_000_000) {
            result.append(convertNumberToWords(number / 10_000_000)).append(" Crore ");
            number %= 10_000_000;
        }
        if (number >= 100_000) {
            result.append(convertNumberToWords(number / 100_000)).append(" Lakh ");
            number %= 100_000;
        }
        if (number >= 1_000) {
            result.append(convertNumberToWords(number / 1_000)).append(" Thousand ");
            number %= 1_000;
        }
        if (number >= 100) {
            result.append(ones[(int) (number / 100)]).append(" Hundred ");
            number %= 100;
        }
        if (number > 0) {
            if (number < 20) {
                result.append(ones[(int) number]);
            } else {
                result.append(tens[(int) (number / 10)]);
                if (number % 10 > 0) {
                    result.append(" ").append(ones[(int) (number % 10)]);
                }
            }
        }

        return result.toString().trim();
    }
}
