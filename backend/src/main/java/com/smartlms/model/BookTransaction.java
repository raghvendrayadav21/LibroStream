package com.smartlms.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * BookTransaction Document - MongoDB 'book_transactions' collection
 * 
 * Har baar jab koi student koi book issue karata hai,
 * ek naya transaction record create hota hai.
 * 
 * STATUS FLOW:
 * ISSUED → (due date ke baad automatically) → OVERDUE → (return par) → RETURNED
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "book_transactions")
public class BookTransaction {

    @Id
    private String id;

    /** Tenant scoping */
    private String collegeId;

    /** Reference to User (student) */
    private String studentId;

    /** Denormalized for easy display (DB join ki zaroorat na pade) */
    private String studentName;
    private String studentEmail;

    /** Reference to Book */
    private String bookId;

    /** Denormalized for easy display */
    private String bookTitle;
    private String bookAuthor;

    /** Jab book issue ki gayi */
    private LocalDate issueDate;

    /** Jab tak wapas karni hai (issueDate + college.loanDurationDays) */
    private LocalDate dueDate;

    /**
     * Jab wapas ki gayi (null = abhi bhi student ke paas hai)
     * Return karne par yahan date set hoti hai
     */
    private LocalDate returnDate;

    /**
     * Transaction ka current status:
     * - "ISSUED"   → Book student ke paas hai, due date nahi aayi
     * - "OVERDUE"  → Due date nikal gayi, still not returned
     * - "RETURNED" → Book wapas aa gayi
     */
    @Builder.Default
    private String status = "ISSUED";

    /**
     * Final penalty amount (sirf tab set hoti hai jab RETURNED ho)
     * Jab tak ISSUED/OVERDUE hai, penalty live calculate hoti hai — yahan 0 rahega
     */
    @Builder.Default
    private double penaltyAmount = 0.0;

    /** Kab issue hua (with time) */
    private LocalDateTime issuedAt;
}
