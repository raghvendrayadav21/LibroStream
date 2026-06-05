package com.smartlms.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

// =====================================================================
//  AUTH DTOs - Request & Response objects for Authentication APIs
//  These are used to receive data from frontend and send back responses
// =====================================================================

public class AuthDto {

    // ---- REGISTER REQUEST ----
    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        private String branch;
        private String enrollmentYear;
        private String phoneNumber;

        @NotBlank(message = "OTP is required")
        @Size(min = 6, max = 6, message = "OTP must be 6 digits")
        private String otp;
    }

    // ---- FORGOT PASSWORD REQUEST ----
    @Data
    public static class ForgotPasswordRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;
    }

    // ---- RESET PASSWORD REQUEST ----
    @Data
    public static class ResetPasswordRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        @NotBlank(message = "OTP is required")
        @Size(min = 6, max = 6, message = "OTP must be 6 digits")
        private String otp;

        @NotBlank(message = "New Password is required")
        @Size(min = 6, message = "New Password must be at least 6 characters")
        private String newPassword;
    }

    // ---- OTP REQUEST ----
    @Data
    public static class OtpRequest {
        @NotBlank(message = "Email is required")
        @Email
        private String email;

        @NotBlank(message = "OTP is required")
        @Size(min = 6, max = 6, message = "OTP must be 6 digits")
        private String otp;

        // OTP verify ke baad account activate karne ke liye
        private String collegeCode;
    }

    // ---- SEND OTP REQUEST ----
    @Data
    public static class SendOtpRequest {
        @NotBlank(message = "Email is required")
        @Email
        private String email;

        private String name; // Email me naam dikhane ke liye
    }

    // ---- LOGIN REQUEST ----
    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    // ---- LOGIN/AUTH RESPONSE ----
    @Data
    public static class AuthResponse {
        private String token;
        private String email;
        private String name;
        private String role;
        private String collegeId;
        private String collegeName;
        private String message;

        public AuthResponse(String token, String email, String name,
                            String role, String collegeId, String collegeName) {
            this.token = token;
            this.email = email;
            this.name = name;
            this.role = role;
            this.collegeId = collegeId;
            this.collegeName = collegeName;
            this.message = "Login successful";
        }
    }

    // ---- GENERIC MESSAGE RESPONSE ----
    @Data
    public static class MessageResponse {
        private String message;
        private boolean success;

        public MessageResponse(String message, boolean success) {
            this.message = message;
            this.success = success;
        }

        public static MessageResponse success(String message) {
            return new MessageResponse(message, true);
        }

        public static MessageResponse error(String message) {
            return new MessageResponse(message, false);
        }
    }
}
