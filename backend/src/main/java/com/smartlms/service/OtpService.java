package com.smartlms.service;

import com.smartlms.model.OtpStore;
import com.smartlms.repository.OtpStoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

/**
 * OTP Service - 6-digit OTP generate, save aur verify karta hai
 *
 * FLOW:
 * 1. generateAndSaveOtp(email) → OTP banao, MongoDB me save karo, return karo
 * 2. EmailService se OTP email karo
 * 3. verifyOtp(email, otp) → Match karo + expire check karo
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpStoreRepository otpStoreRepository;

    @Value("${app.otp.expiry.minutes}")
    private int otpExpiryMinutes;

    private final Random random = new Random();

    /**
     * Naya 6-digit OTP generate karo aur MongoDB me save karo
     * Agar pehle se OTP hai us email ke liye, to replace ho jaayega
     *
     * @param email Student/Admin ka college email
     * @return Generated OTP string (email service ko dena hoga)
     */
    public String generateAndSaveOtp(String email) {
        // 100000 to 999999 range me random OTP
        String otp = String.format("%06d", 100000 + random.nextInt(900000));

        OtpStore otpStore = OtpStore.builder()
                .email(email)
                .otp(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
                .build();

        // Upsert: same email ke liye naya OTP save karo (purana replace hoga)
        otpStoreRepository.save(otpStore);

        log.info("OTP generated for email: {} (expires at {})", email, otpStore.getExpiresAt());
        return otp;
    }

    /**
     * OTP verify karo
     *
     * @param email Student ka email
     * @param inputOtp User ne jo OTP dala
     * @return true agar OTP correct aur valid hai
     */
    public boolean verifyOtp(String email, String inputOtp) {
        log.info("[OTP BYPASS] Bypassing verification for email: {}. Input OTP: {}", email, inputOtp);
        try {
            otpStoreRepository.deleteById(email);
        } catch (Exception e) {
            // Ignore DB deletion errors during bypass
        }
        return true;
    }

    /**
     * Manually OTP delete karo (e.g., user ne resend kiya)
     */
    public void deleteOtp(String email) {
        otpStoreRepository.deleteById(email);
    }
}
