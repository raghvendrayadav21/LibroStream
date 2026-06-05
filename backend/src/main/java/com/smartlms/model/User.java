package com.smartlms.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * User Document - MongoDB 'users' collection
 * 
 * STUDENT aur FACULTY_ADMIN dono is collection me hote hain.
 * Har user ek specific college se linked hota hai (collegeId ke through).
 * Iska matlab ek student sirf apne college ke data ko access kar sakta hai.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    /** Kis college ka user hai (Multi-tenancy ka key) */
    private String collegeId;

    /** User ka poora naam */
    private String name;

    /** College email ID — unique + indexed for fast lookup */
    @Indexed(unique = true)
    private String email;

    /** BCrypt se encrypted password */
    private String password;

    /**
     * User ka role:
     * - "STUDENT" → Student dashboard access
     * - "FACULTY_ADMIN" → Admin dashboard access (full control)
     */
    @Builder.Default
    private String role = "STUDENT";

    /** Branch/Department, e.g., "Computer Science", "Mechanical" */
    private String branch;

    /** Enrollment year, e.g., "2026" */
    private String enrollmentYear;

    /** Phone number (optional) */
    private String phoneNumber;

    /**
     * Unique library card number — auto-generated at registration
     * Format: LIB-{YEAR}-{4-digit-random}, e.g., "LIB-2026-8891"
     */
    private String libraryCardNumber;

    /**
     * Student ka QR code — Base64 encoded PNG image
     * ZXing library se generate hota hai
     * Ismein student ID + library card number embed hota hai
     * Student ka Digital ID Card isi QR se display hota hai
     */
    private String qrCodeBase64;

    /** OTP verify karne ke baad hi true hota hai */
    @Builder.Default
    private boolean isActive = false;

    /** Account kab bana */
    @CreatedDate
    private LocalDateTime createdAt;
}
