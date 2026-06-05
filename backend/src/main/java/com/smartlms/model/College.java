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
 * College Document - MongoDB 'colleges' collection
 * 
 * Har college ka apna record hoga is collection me.
 * Yeh SmartLMS ka core multi-tenant entity hai.
 * Ek college ka admin pehle register karta hai,
 * phir uske students us college ke domain se register karte hain.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "colleges")
public class College {

    @Id
    private String id;

    /** College ka full name, e.g., "MIT College of Engineering, Indore" */
    private String collegeName;

    /** Unique short code, e.g., "MITIND" — login me use hoga */
    @Indexed(unique = true)
    private String collegeCode;

    /**
     * Students ke email ka allowed domain, e.g., "@mitindore.edu"
     * Isi se dynamic domain validation hogi (hardcoded nahi)
     */
    @Indexed(unique = true)
    private String allowedEmailDomain;

    /** College ka address */
    private String address;

    /** College ka city / state */
    private String city;

    /** Admin ka email (pehla account automatically FACULTY_ADMIN ban jaata hai) */
    private String adminEmail;

    /** College logo — Base64 encoded image string, library card pe dikhega */
    private String logoBase64;

    /** Fine per day (₹) for overdue books — college khud set karega */
    @Builder.Default
    private double penaltyPerDay = 5.0;

    /** Kitne din baad book wapas karni chahiye (default 14 days) */
    @Builder.Default
    private int loanDurationDays = 14;

    /** Is college ka account active hai ya nahi */
    @Builder.Default
    private boolean isActive = true;

    /** Jab college ne register kiya */
    @CreatedDate
    private LocalDateTime createdAt;
}
