package com.smartlms.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * QR Code Generator - ZXing library use karke QR code PNG → Base64 string banata hai
 *
 * Generated QR Code me embed hota hai:
 * "SMARTLMS:{studentId}:{libraryCardNumber}"
 *
 * Jab faculty yeh QR scan karti hai, to iska content decode hokar
 * backend API ko bheja jaata hai jo student ka pura profile return karta hai.
 */
@Slf4j
@Component
public class QRCodeGenerator {

    private static final int QR_WIDTH = 300;
    private static final int QR_HEIGHT = 300;

    /**
     * Main method: Student ki info se QR code banata hai
     *
     * @param studentId       MongoDB User ka _id
     * @param libraryCardNumber e.g., "LIB-2026-8891"
     * @return Base64 encoded PNG string (frontend me directly <img src="..."> me use hoga)
     */
    public String generateStudentQRCode(String studentId, String libraryCardNumber) {
        // QR me yeh content embed hoga
        String qrContent = "SMARTLMS:" + studentId + ":" + libraryCardNumber;
        return generateQRCodeBase64(qrContent);
    }

    /**
     * Kisi bhi content ka QR code banao
     *
     * @param content QR code me embed karna wala text
     * @return Base64 PNG string
     */
    public String generateQRCodeBase64(String content) {
        try {
            // ZXing QR code settings
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H); // High error correction
            hints.put(EncodeHintType.MARGIN, 2);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");

            // QR Code matrix banao
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, QR_WIDTH, QR_HEIGHT, hints);

            // Matrix → PNG image → byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            byte[] pngBytes = outputStream.toByteArray();

            // Byte array → Base64 string (frontend me directly use hoga)
            String base64 = Base64.getEncoder().encodeToString(pngBytes);
            return "data:image/png;base64," + base64;

        } catch (WriterException | IOException e) {
            log.error("QR Code generate karne me error: {}", e.getMessage());
            throw new RuntimeException("QR Code generation failed: " + e.getMessage());
        }
    }

    /**
     * QR Code content se studentId extract karo
     * (scan ke baad use hota hai)
     *
     * @param qrContent Scanned QR ka text e.g., "SMARTLMS:665abc:LIB-2026-8891"
     * @return studentId
     */
    public String extractStudentIdFromQR(String qrContent) {
        if (qrContent == null || !qrContent.startsWith("SMARTLMS:")) {
            throw new IllegalArgumentException("Invalid SmartLMS QR code format");
        }
        String[] parts = qrContent.split(":");
        if (parts.length < 3) {
            throw new IllegalArgumentException("Malformed QR code content");
        }
        return parts[1]; // studentId
    }
}
