package com.smartlms.controller;

import com.smartlms.dto.BookDto.*;
import com.smartlms.model.User;
import com.smartlms.repository.TransactionRepository;
import com.smartlms.repository.UserRepository;
import com.smartlms.service.BookService;
import com.smartlms.service.TransactionService;
import com.smartlms.util.QRCodeGenerator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin Controller — Faculty Admin ke endpoints (The Control Center)
 *
 * PROTECTED (FACULTY_ADMIN role, JWT required):
 *
 * BOOK MANAGEMENT:
 *   GET    /api/admin/books              → All books inventory
 *   POST   /api/admin/books              → Add single book
 *   POST   /api/admin/books/bulk         → Bulk add books
 *   DELETE /api/admin/books/{bookId}     → Delete book
 *   GET    /api/admin/books/search       → Search books
 *
 * STUDENT MANAGEMENT:
 *   GET    /api/admin/students           → All students of college
 *   GET    /api/admin/student/{id}       → Student profile (QR scan ke baad)
 *   GET    /api/admin/student/qr         → QR content se student dhundho
 *
 * TRANSACTIONS:
 *   GET    /api/admin/transactions       → All transactions
 *   POST   /api/admin/issue             → Issue book
 *   PUT    /api/admin/return/{txnId}    → Return book
 *
 * DASHBOARD:
 *   GET    /api/admin/dashboard/stats   → Overview stats
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FACULTY_ADMIN')")
public class AdminController {

    private final BookService bookService;
    private final TransactionService transactionService;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final QRCodeGenerator qrCodeGenerator;
    private final com.smartlms.service.UserService userService;

    // =================================================================
    //  BOOK MANAGEMENT
    // =================================================================

    @GetMapping("/books")
    public ResponseEntity<List<BookResponse>> getAllBooks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            Authentication auth) {
        String collegeId = (String) auth.getCredentials();

        if (search != null && !search.isBlank()) {
            // Title ya author me search
            List<BookResponse> byTitle = bookService.searchByTitle(collegeId, search);
            List<BookResponse> byAuthor = bookService.searchByAuthor(collegeId, search);
            // Merge + deduplicate
            byTitle.addAll(byAuthor.stream()
                    .filter(b -> byTitle.stream().noneMatch(t -> t.getId().equals(b.getId())))
                    .collect(Collectors.toList()));
            return ResponseEntity.ok(byTitle);
        }

        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(bookService.filterByCategory(collegeId, category));
        }

        return ResponseEntity.ok(bookService.getAllBooks(collegeId));
    }

    @PostMapping("/books")
    public ResponseEntity<BookResponse> addBook(@Valid @RequestBody BookRequest request,
                                                 Authentication auth) {
        String collegeId = (String) auth.getCredentials();
        return ResponseEntity.status(HttpStatus.CREATED).body(bookService.addBook(collegeId, request));
    }

    @PostMapping("/books/bulk")
    public ResponseEntity<List<BookResponse>> addBulkBooks(@RequestBody List<BookRequest> requests,
                                                            Authentication auth) {
        String collegeId = (String) auth.getCredentials();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookService.addBulkBooks(collegeId, requests));
    }

    @PutMapping("/books/{bookId}")
    public ResponseEntity<BookResponse> updateBook(@PathVariable String bookId,
                                                   @Valid @RequestBody BookRequest request,
                                                   Authentication auth) {
        String collegeId = (String) auth.getCredentials();
        return ResponseEntity.ok(bookService.updateBook(collegeId, bookId, request));
    }

    @DeleteMapping("/books/{bookId}")
    public ResponseEntity<?> deleteBook(@PathVariable String bookId, Authentication auth) {
        String collegeId = (String) auth.getCredentials();
        bookService.deleteBook(collegeId, bookId);
        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("message", "Book deleted successfully");
        resp.put("success", true);
        return ResponseEntity.ok(resp);
    }

    // =================================================================
    //  STUDENT MANAGEMENT
    // =================================================================

    /** Saare students list */
    @GetMapping("/students")
    public ResponseEntity<?> getAllStudents(Authentication auth) {
        String collegeId = (String) auth.getCredentials();
        List<User> students = userRepository.findByCollegeIdAndRole(collegeId, "STUDENT");

        List<Map<String, Object>> result = students.stream().map(s -> {
            Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", s.getId());
            m.put("name", s.getName());
            m.put("email", s.getEmail());
            m.put("branch", s.getBranch() != null ? s.getBranch() : "");
            m.put("enrollmentYear", s.getEnrollmentYear() != null ? s.getEnrollmentYear() : "");
            m.put("libraryCardNumber", s.getLibraryCardNumber());
            m.put("isActive", s.isActive());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * QR SCAN → STUDENT PROFILE
     * GET /api/admin/student/{studentId}
     * Frontend QR scan karta hai → studentId milti hai → yeh API call hoti hai
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<StudentProfileResponse> getStudentProfile(
            @PathVariable String studentId, Authentication auth) {
        String collegeId = (String) auth.getCredentials();

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        // Security: sirf apne college ka student
        if (!student.getCollegeId().equals(collegeId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Active books fetch karo
        List<TransactionResponse> activeBooks =
                transactionService.getStudentActiveBooks(student.getId(), collegeId);

        double totalPenalty = activeBooks.stream()
                .mapToDouble(t -> t.getLivePenalty() > 0 ? t.getLivePenalty() : t.getPenaltyAmount())
                .sum();

        StudentProfileResponse profile = new StudentProfileResponse();
        profile.setId(student.getId());
        profile.setName(student.getName());
        profile.setEmail(student.getEmail());
        profile.setBranch(student.getBranch());
        profile.setEnrollmentYear(student.getEnrollmentYear());
        profile.setLibraryCardNumber(student.getLibraryCardNumber());
        profile.setQrCodeBase64(student.getQrCodeBase64());
        profile.setActiveBooks(activeBooks);
        profile.setTotalPendingPenalty(totalPenalty);

        return ResponseEntity.ok(profile);
    }

    /**
     * QR CONTENT SE STUDENT DHUNDHO
     * GET /api/admin/student/qr?content=SMARTLMS:665abc:LIB-2026-8891
     * (Alternative: frontend QR content decode karke yahan bheje)
     */
    @GetMapping("/student/qr")
    public ResponseEntity<StudentProfileResponse> getStudentByQRContent(
            @RequestParam String content, Authentication auth) {
        String collegeId = (String) auth.getCredentials();
        String studentId = qrCodeGenerator.extractStudentIdFromQR(content);
        // Reuse above method logic
        return getStudentProfile(studentId, auth);
    }

    @PutMapping("/student/{studentId}/toggle-status")
    public ResponseEntity<?> toggleStudentStatus(@PathVariable String studentId, Authentication auth) {
        String collegeId = (String) auth.getCredentials();
        User updatedStudent = userService.toggleStudentStatus(studentId, collegeId)
                .orElseThrow(() -> new RuntimeException("Student not found or unauthorized to toggle status"));

        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("message", "Student status updated successfully");
        resp.put("isActive", updatedStudent.isActive());
        resp.put("success", true);
        return ResponseEntity.ok(resp);
    }

    // =================================================================
    //  TRANSACTIONS: ISSUE & RETURN
    // =================================================================

    @GetMapping("/transactions")
    public ResponseEntity<List<TransactionResponse>> getAllTransactions(
            @RequestParam(required = false) String status, Authentication auth) {
        String collegeId = (String) auth.getCredentials();
        List<TransactionResponse> all = transactionService.getAllCollegeTransactions(collegeId);

        if (status != null && !status.isBlank()) {
            all = all.stream()
                    .filter(t -> t.getStatus().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(all);
    }

    @PostMapping("/issue")
    public ResponseEntity<?> issueBook(@Valid @RequestBody IssueBookRequest request,
                                       Authentication auth) {
        try {
            String collegeId = (String) auth.getCredentials();
            TransactionResponse response = transactionService.issueBook(collegeId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            Map<String, Object> errResp = new java.util.HashMap<>();
            errResp.put("error", e.getMessage());
            errResp.put("success", false);
            return ResponseEntity.badRequest().body(errResp);
        }
    }

    @PutMapping("/return/{transactionId}")
    public ResponseEntity<?> returnBook(@PathVariable String transactionId, Authentication auth) {
        try {
            String collegeId = (String) auth.getCredentials();
            TransactionResponse response = transactionService.returnBook(collegeId, transactionId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errResp = new java.util.HashMap<>();
            errResp.put("error", e.getMessage());
            errResp.put("success", false);
            return ResponseEntity.badRequest().body(errResp);
        }
    }

    @PutMapping("/penalty/{transactionId}/clear")
    public ResponseEntity<?> clearPenalty(@PathVariable String transactionId, Authentication auth) {
        try {
            String collegeId = (String) auth.getCredentials();
            TransactionResponse response = transactionService.clearPenalty(collegeId, transactionId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errResp = new java.util.HashMap<>();
            errResp.put("error", e.getMessage());
            errResp.put("success", false);
            return ResponseEntity.badRequest().body(errResp);
        }
    }

    // =================================================================
    //  DASHBOARD STATS
    //  GET /api/admin/dashboard/stats
    // =================================================================
    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStats> getDashboardStats(Authentication auth) {
        String collegeId = (String) auth.getCredentials();

        DashboardStats stats = new DashboardStats();
        stats.setTotalStudents(userRepository.countByCollegeIdAndRole(collegeId, "STUDENT"));
        stats.setTotalBooks(bookService.getAllBooks(collegeId).stream()
                .mapToLong(b -> b.getTotalCopies()).sum());
        stats.setIssuedBooks(transactionRepository.countByCollegeIdAndStatus(collegeId, "ISSUED"));
        stats.setOverdueBooks(transactionRepository.countByCollegeIdAndStatus(collegeId, "OVERDUE"));

        long returnedToday = transactionRepository.countByCollegeIdAndStatusAndReturnDate(
                collegeId, "RETURNED", java.time.LocalDate.now());
        stats.setReturnedToday(returnedToday);

        // Total pending fines
        double totalFines = transactionService.getAllCollegeTransactions(collegeId).stream()
                .filter(t -> !"RETURNED".equals(t.getStatus()))
                .mapToDouble(TransactionResponse::getLivePenalty)
                .sum();
        stats.setTotalPendingFines(totalFines);

        return ResponseEntity.ok(stats);
    }
}
