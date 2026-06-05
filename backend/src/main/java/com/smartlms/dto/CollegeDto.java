package com.smartlms.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

// =====================================================================
//  COLLEGE DTOs - College onboarding aur settings ke liye
// =====================================================================

public class CollegeDto {

    // ---- COLLEGE REGISTER REQUEST (3-step wizard ka data) ----
    @Data
    public static class CollegeRegisterRequest {

        // Step 1: College Info
        @NotBlank(message = "College name is required")
        private String collegeName;

        @NotBlank(message = "College code is required")
        @Size(min = 3, max = 10, message = "College code must be 3-10 characters")
        private String collegeCode;

        private String address;
        private String city;

        // Step 2: Admin Account
        @NotBlank(message = "Admin name is required")
        private String adminName;

        @NotBlank(message = "Admin email is required")
        @Email(message = "Valid email is required")
        private String adminEmail;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String adminPassword;

        // Step 3: Library Configuration
        @NotBlank(message = "Allowed email domain is required")
        @Pattern(regexp = "^@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                message = "Domain format must be like @college.edu")
        private String allowedEmailDomain;

        @DecimalMin(value = "0.0", message = "Penalty cannot be negative")
        private double penaltyPerDay = 5.0;

        @Min(value = 1, message = "Loan duration must be at least 1 day")
        @Max(value = 90, message = "Loan duration cannot exceed 90 days")
        private int loanDurationDays = 14;

        // Logo (optional - Base64 string)
        private String logoBase64;
    }

    // ---- COLLEGE SETTINGS UPDATE ----
    @Data
    public static class CollegeSettingsRequest {
        private String collegeName;
        private String address;
        private String city;
        private String allowedEmailDomain;
        private double penaltyPerDay;
        private int loanDurationDays;
        private String logoBase64;
    }

    // ---- COLLEGE INFO RESPONSE ----
    @Data
    public static class CollegeResponse {
        private String id;
        private String collegeName;
        private String collegeCode;
        private String allowedEmailDomain;
        private String address;
        private String city;
        private String adminEmail;
        private String logoBase64;
        private double penaltyPerDay;
        private int loanDurationDays;
        private boolean isActive;

        // Stats (dashboard ke liye)
        private long totalStudents;
        private long totalBooks;
        private long issuedBooks;
        private long overdueBooks;
    }

    // ---- CHECK COLLEGE CODE (unique validation) ----
    @Data
    public static class CheckCodeRequest {
        @NotBlank
        private String collegeCode;
    }
}
