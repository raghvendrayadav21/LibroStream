package com.smartlms.controller;

import com.smartlms.dto.AuthDto.*;
import com.smartlms.model.College;
import com.smartlms.model.User;
import com.smartlms.repository.CollegeRepository;
import com.smartlms.repository.UserRepository;
import com.smartlms.service.EmailService;
import com.smartlms.service.OtpService;
import com.smartlms.util.JwtUtil;
import com.smartlms.util.QRCodeGenerator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Year;
import java.util.Optional;
import java.util.Random;

/**
 * Authentication Controller
 *
 * PUBLIC ENDPOINTS (no JWT needed):
 * POST /api/auth/send-otp      → OTP email bhejo
 * POST /api/auth/register      → OTP verify + account create
 * POST /api/auth/login         → Login → JWT return karo
 *
 * FLOW:
 * 1. User /send-otp hit karta hai → OTP email milta hai
 * 2. /register me OTP + details deta hai → account banta hai
 * 3. /login me email+password → JWT token milta hai
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final CollegeRepository collegeRepository;
    private final OtpService otpService;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;
    private final QRCodeGenerator qrCodeGenerator;
    private final PasswordEncoder passwordEncoder;
    private final com.smartlms.service.UserService userService;

    // =====================================================================
    //  STEP 1: OTP Send karo
    //  POST /api/auth/send-otp
    //  Body: { "email": "student@college.edu", "name": "Arjun" }
    // =====================================================================
    @PostMapping("/send-otp")
    public ResponseEntity<MessageResponse> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Check: email already registered hai?
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("This email is already registered. Please login."));
        }

        // Check: is email domain ka koi college registered hai?
        String domain = extractDomain(email);
        Optional<College> college = collegeRepository.findFirstByAllowedEmailDomain(domain);
        if (college.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error(
                            "No college registered for domain: " + domain +
                            ". Please ask your admin to register the college first."));
        }

        // OTP generate karo aur email bhejo
        String otp = otpService.generateAndSaveOtp(email);
        emailService.sendOtpEmail(email, otp, request.getName() != null ? request.getName() : "Student");

        log.info("OTP sent to: {}", email);
        return ResponseEntity.ok(MessageResponse.success(
                "OTP sent to " + email + ". Valid for 10 minutes."));
    }

    // =====================================================================
    //  STEP 2: Register (OTP verify + account create)
    //  POST /api/auth/register
    //  Body: { email, password, otp, name, branch, collegeCode, ... }
    // =====================================================================
    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Double-check: already registered?
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Email already registered."));
        }

        // College dhundho (domain se)
        String domain = extractDomain(email);
        Optional<College> collegeOpt = collegeRepository.findFirstByAllowedEmailDomain(domain);
        if (collegeOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Invalid college email domain."));
        }
        College college = collegeOpt.get();

        // OTP verify karo
        boolean isValid = otpService.verifyOtp(email, request.getOtp());
        if (!isValid) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Invalid or expired OTP. Please request a new one."));
        }

        // Unique Library Card Number generate karo using UserService
        String libraryCardNumber = userService.generateUniqueLibraryCardNumber();

        // User object banao (set isActive to true immediately because OTP is verified)
        User user = User.builder()
                .collegeId(college.getId())
                .name(request.getName())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role("STUDENT")
                .branch(request.getBranch())
                .enrollmentYear(request.getEnrollmentYear())
                .phoneNumber(request.getPhoneNumber())
                .libraryCardNumber(libraryCardNumber)
                .isActive(true)
                .build();

        // Pehle save karo (ID milegi)
        user = userRepository.save(user);

        // QR Code generate karo (studentId + libraryCardNumber)
        String qrCode = qrCodeGenerator.generateStudentQRCode(user.getId(), libraryCardNumber);
        user.setQrCodeBase64(qrCode);
        userRepository.save(user);

        log.info("User registered and activated: {}", email);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(MessageResponse.success(
                        "Registration successful! Your account is now active. Please login."));
    }

    // =====================================================================
    //  STEP 2b: OTP Verify + Account Activate (Optional fallback endpoint)
    //  POST /api/auth/verify-otp
    //  Body: { "email": "student@college.edu", "otp": "482910" }
    // =====================================================================
    @PostMapping("/verify-otp")
    public ResponseEntity<MessageResponse> verifyOtp(@Valid @RequestBody OtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Check if user already active
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && userOpt.get().isActive()) {
            return ResponseEntity.ok(MessageResponse.success("Account is already verified."));
        }

        // OTP verify karo
        boolean isValid = otpService.verifyOtp(email, request.getOtp());
        if (!isValid) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Invalid or expired OTP. Please request a new one."));
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("User not found. Please register first."));
        }

        User user = userOpt.get();
        user.setActive(true);
        userRepository.save(user);

        log.info("Account activated for: {}", email);
        return ResponseEntity.ok(MessageResponse.success(
                "Account verified successfully! You can now login."));
    }

    // =====================================================================
    //  FORGOT PASSWORD
    //  POST /api/auth/forgot-password
    //  Body: { "email": "student@college.edu" }
    // =====================================================================
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Check if user exists
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Email not registered."));
        }

        User user = userOpt.get();
        // Generate OTP and send reset email
        String otp = otpService.generateAndSaveOtp(email);
        emailService.sendPasswordResetEmail(email, otp, user.getName());

        log.info("Password reset OTP sent to: {}", email);
        return ResponseEntity.ok(MessageResponse.success("Password reset OTP sent to " + email));
    }

    // =====================================================================
    //  RESET PASSWORD
    //  POST /api/auth/reset-password
    //  Body: { "email": "student@college.edu", "otp": "123456", "newPassword": "newpassword123" }
    // =====================================================================
    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Verify OTP
        boolean isValid = otpService.verifyOtp(email, request.getOtp());
        if (!isValid) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Invalid or expired OTP."));
        }

        // Update password
        boolean updated = userService.updatePassword(email, request.getNewPassword());
        if (!updated) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("User not found."));
        }

        log.info("Password reset successful for user: {}", email);
        return ResponseEntity.ok(MessageResponse.success("Password reset successful. You can now login."));
    }

    // =====================================================================
    //  STEP 3: Login
    //  POST /api/auth/login
    //  Body: { "email": "student@college.edu", "password": "mypassword" }
    //  Returns: JWT Token
    // =====================================================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // User dhundho
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(MessageResponse.error("Invalid email or password."));
        }

        User user = userOpt.get();

        // Account active hai?
        if (!user.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(MessageResponse.error(
                            "Account not verified. Please verify your OTP first."));
        }

        // Password match karo
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(MessageResponse.error("Invalid email or password."));
        }

        // College info
        College college = collegeRepository.findById(user.getCollegeId())
                .orElseThrow(() -> new RuntimeException("College not found"));

        // JWT Token generate karo
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getCollegeId());

        log.info("Login successful: {} ({})", email, user.getRole());
        return ResponseEntity.ok(new AuthResponse(
                token, user.getEmail(), user.getName(),
                user.getRole(), user.getCollegeId(), college.getCollegeName()));
    }

    // =====================================================================
    //  RESEND OTP
    //  POST /api/auth/resend-otp
    // =====================================================================
    @PostMapping("/resend-otp")
    public ResponseEntity<MessageResponse> resendOtp(@RequestBody SendOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        Optional<User> userOpt = userRepository.findByEmail(email);
        String name = userOpt.map(User::getName).orElse("Student");

        String otp = otpService.generateAndSaveOtp(email);
        emailService.sendOtpEmail(email, otp, name);

        return ResponseEntity.ok(MessageResponse.success("New OTP sent to " + email));
    }

    // =====================================================================
    //  PRIVATE HELPERS
    // =====================================================================

    /** Email se domain extract karo: "student@mitindore.edu" → "@mitindore.edu" */
    private String extractDomain(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex < 0) throw new IllegalArgumentException("Invalid email format");
        return email.substring(atIndex); // "@mitindore.edu"
    }
}
