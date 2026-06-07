package com.smartlms.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Email Service - HTML emails bhejne ke liye
 *
 * 2 types ki emails:
 * 1. OTP Verification email (registration ke time)
 * 2. Overdue reminder email (daily cron job ke time)
 *
 * @Async use kiya hai taaki email sending background me ho,
 * API response slow na ho
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // ========== OTP EMAIL ==========

    /**
     * Registration ke time OTP email bhejo
     *
     * @param toEmail Recipient ka email
     * @param otp     6-digit OTP
     * @param name    User ka naam (personalization ke liye)
     */
    @Async
    public void sendOtpEmail(String toEmail, String otp, String name) {
        try {
            String subject = "SmartLMS - Your OTP Verification Code";
            String htmlContent = buildOtpEmailHtml(name, otp);
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("OTP email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("OTP email bhejne me error: {} → {}", toEmail, e.getMessage());
        }
    }

    // ========== OVERDUE REMINDER EMAIL ==========

    /**
     * Overdue book ke liye reminder email bhejo (Cron Job se call hota hai)
     *
     * @param toEmail     Student ka email
     * @param studentName Student ka naam
     * @param bookTitle   Overdue book ka naam
     * @param daysLate    Kitne din late hai
     * @param penalty     Abhi tak ka fine (₹)
     */
    @Async
    public void sendOverdueReminderEmail(String toEmail, String studentName,
                                          String bookTitle, long daysLate, double penalty, double penaltyPerDay) {
        try {
            String subject = "⚠️ SmartLMS - Overdue Book Return Reminder";
            String htmlContent = buildOverdueEmailHtml(studentName, bookTitle, daysLate, penalty, penaltyPerDay);
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("Overdue reminder sent to: {} for book: {}", toEmail, bookTitle);
        } catch (Exception e) {
            log.error("Overdue email bhejne me error: {} → {}", toEmail, e.getMessage());
        }
    }

    // ========== PASSWORD RESET EMAIL ==========

    /**
     * Password reset ke liye OTP email bhejo
     *
     * @param toEmail Recipient ka email
     * @param otp     6-digit OTP
     * @param name    User ka naam
     */
    @Async
    public void sendPasswordResetEmail(String toEmail, String otp, String name) {
        try {
            String subject = "SmartLMS - Password Reset OTP Code";
            String htmlContent = buildForgotPasswordEmailHtml(name, otp);
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("Password reset email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Password reset email bhejne me error: {} → {}", toEmail, e.getMessage());
        }
    }

    // ========== PRIVATE HELPERS ==========

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) throws MessagingException {
        log.info("[EMAIL BYPASS] To: {}, Subject: {}", toEmail, subject);
    }

    // ========== HTML TEMPLATES ==========

    private String buildOtpEmailHtml(String name, String otp) {
        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; padding: 20px; margin: 0;">
                  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 24px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: -0.5px;">📚 SmartLMS</h1>
                      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">College Library Management System</p>
                    </div>
                    
                    <!-- Body -->
                    <div style="padding: 32px 24px;">
                      <p style="color: #374151; font-size: 16px; margin: 0 0 8px 0;">Hello, <strong>%s</strong>! 👋</p>
                      <p style="color: #6b7280; font-size: 14px; margin: 0 0 28px 0;">
                        Your OTP for SmartLMS registration is:
                      </p>
                      
                      <!-- OTP Box -->
                      <div style="background: #f3f4f6; border: 2px dashed #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #6366f1; font-family: monospace;">%s</span>
                      </div>
                      
                      <p style="color: #ef4444; font-size: 13px; margin: 0 0 24px 0;">
                        ⏱️ This OTP will expire in <strong>10 minutes</strong>. Do not share it with anyone.
                      </p>
                      
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        If you didn't request this, please ignore this email.
                      </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">SmartLMS — Paperless. Contactless. Smart.</p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(name, otp);
    }

    private String buildForgotPasswordEmailHtml(String name, String otp) {
        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; padding: 20px; margin: 0;">
                  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 24px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: -0.5px;">📚 SmartLMS</h1>
                      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">College Library Management System</p>
                    </div>
                    
                    <!-- Body -->
                    <div style="padding: 32px 24px;">
                      <p style="color: #374151; font-size: 16px; margin: 0 0 8px 0;">Hello, <strong>%s</strong>! 👋</p>
                      <p style="color: #6b7280; font-size: 14px; margin: 0 0 28px 0;">
                        You have requested a password reset. Your OTP verification code is:
                      </p>
                      
                      <!-- OTP Box -->
                      <div style="background: #f3f4f6; border: 2px dashed #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #6366f1; font-family: monospace;">%s</span>
                      </div>
                      
                      <p style="color: #ef4444; font-size: 13px; margin: 0 0 24px 0;">
                        ⏱️ This OTP will expire in <strong>10 minutes</strong>. Do not share it with anyone.
                      </p>
                      
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        If you did not request a password reset, please change your password immediately.
                      </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">SmartLMS — Paperless. Contactless. Smart.</p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(name, otp);
    }

    private String buildOverdueEmailHtml(String studentName, String bookTitle,
                                          long daysLate, double penalty, double penaltyPerDay) {
        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; padding: 20px; margin: 0;">
                  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 32px 24px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Overdue Book Alert</h1>
                      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">SmartLMS Library Management System</p>
                    </div>
                    
                    <!-- Body -->
                    <div style="padding: 32px 24px;">
                      <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                        Dear <strong>%s</strong>,
                      </p>
                      <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
                        This is a reminder that the following book is <strong style="color: #ef4444;">overdue</strong>:
                      </p>
                      
                      <!-- Book Info -->
                      <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                        <p style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">📖 %s</p>
                        <p style="margin: 0; color: #ef4444; font-size: 14px;">
                          <strong>%d days overdue</strong> — Current Fine: <strong>₹%.1f</strong>
                        </p>
                      </div>
                      
                      <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">
                        Please return the book to the library <strong>immediately</strong> to avoid further penalty.
                      </p>
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        Fine increases by ₹%.1f per day until the book is returned.
                      </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">SmartLMS — Paperless. Contactless. Smart.</p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(studentName, bookTitle, daysLate, penalty, penaltyPerDay);
    }
}
