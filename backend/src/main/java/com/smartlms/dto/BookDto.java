package com.smartlms.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

// =====================================================================
//  BOOK & TRANSACTION DTOs
// =====================================================================

public class BookDto {

    // ---- ADD SINGLE BOOK ----
    @Data
    public static class BookRequest {
        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Author is required")
        private String author;

        private String isbn;
        private String category;

        @Min(value = 1, message = "At least 1 copy is required")
        private int totalCopies = 1;

        private String shelfLocation;
        private String description;
    }

    // ---- BOOK RESPONSE ----
    @Data
    public static class BookResponse {
        private String id;
        private String title;
        private String author;
        private String isbn;
        private String category;
        private int totalCopies;
        private int availableCopies;
        private String shelfLocation;
        private String description;
        private boolean isAvailable;
    }

    // ---- ISSUE BOOK REQUEST ----
    @Data
    public static class IssueBookRequest {
        @NotBlank(message = "Student ID is required")
        private String studentId;

        @NotBlank(message = "Book ID is required")
        private String bookId;
    }

    // ---- TRANSACTION RESPONSE (with live penalty) ----
    @Data
    public static class TransactionResponse {
        private String id;
        private String studentId;
        private String studentName;
        private String studentEmail;
        private String bookId;
        private String bookTitle;
        private String bookAuthor;
        private LocalDate issueDate;
        private LocalDate dueDate;
        private LocalDate returnDate;
        private String status;
        private double penaltyAmount;      // Final amount (returned transactions)
        private double livePenalty;        // Calculated live (for ISSUED/OVERDUE)
        private long daysLate;             // Kitne din late hai
        private boolean isOverdue;
    }

    // ---- STUDENT PROFILE RESPONSE (QR scan ke baad admin ko milta hai) ----
    @Data
    public static class StudentProfileResponse {
        private String id;
        private String name;
        private String email;
        private String branch;
        private String enrollmentYear;
        private String libraryCardNumber;
        private String qrCodeBase64;
        private List<TransactionResponse> activeBooks;  // Currently issued books
        private double totalPendingPenalty;
    }

    // ---- DASHBOARD STATS ----
    @Data
    public static class DashboardStats {
        private long totalStudents;
        private long totalBooks;
        private long issuedBooks;
        private long overdueBooks;
        private long returnedToday;
        private double totalPendingFines;
    }
}
