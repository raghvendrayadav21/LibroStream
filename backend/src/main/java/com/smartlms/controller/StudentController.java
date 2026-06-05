package com.smartlms.controller;

import com.smartlms.dto.BookDto.*;
import com.smartlms.model.College;
import com.smartlms.model.User;
import com.smartlms.repository.CollegeRepository;
import com.smartlms.repository.UserRepository;
import com.smartlms.service.BookService;
import com.smartlms.service.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {

    private final UserRepository userRepository;
    private final CollegeRepository collegeRepository;
    private final TransactionService transactionService;
    private final BookService bookService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        String email = (String) auth.getPrincipal();
        String collegeId = (String) auth.getCredentials();

        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new RuntimeException("College not found"));

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", student.getId());
        resp.put("name", student.getName());
        resp.put("email", student.getEmail());
        resp.put("branch", student.getBranch() != null ? student.getBranch() : "");
        resp.put("enrollmentYear", student.getEnrollmentYear() != null ? student.getEnrollmentYear() : "");
        resp.put("libraryCardNumber", student.getLibraryCardNumber());
        resp.put("qrCodeBase64", student.getQrCodeBase64());
        resp.put("collegeName", college.getCollegeName());
        resp.put("collegeCode", college.getCollegeCode());
        resp.put("collegeLogoBase64", college.getLogoBase64() != null ? college.getLogoBase64() : "");
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/my-books")
    public ResponseEntity<List<TransactionResponse>> getMyBooks(Authentication auth) {
        String email = (String) auth.getPrincipal();
        String collegeId = (String) auth.getCredentials();
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return ResponseEntity.ok(transactionService.getStudentActiveBooks(student.getId(), collegeId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<TransactionResponse>> getTransactionHistory(Authentication auth) {
        String email = (String) auth.getPrincipal();
        String collegeId = (String) auth.getCredentials();
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return ResponseEntity.ok(transactionService.getStudentAllTransactions(student.getId(), collegeId));
    }

    @GetMapping("/penalties")
    public ResponseEntity<?> getLivePenalties(Authentication auth) {
        String email = (String) auth.getPrincipal();
        String collegeId = (String) auth.getCredentials();
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<TransactionResponse> activeBooks =
                transactionService.getStudentActiveBooks(student.getId(), collegeId);

        double totalPendingPenalty = activeBooks.stream()
                .mapToDouble(TransactionResponse::getLivePenalty).sum();
        long overdueCount = activeBooks.stream()
                .filter(TransactionResponse::isOverdue).count();

        Map<String, Object> result = new HashMap<>();
        result.put("activeBooks", activeBooks);
        result.put("totalPendingPenalty", totalPendingPenalty);
        result.put("overdueCount", overdueCount);
        result.put("hasOverdue", overdueCount > 0);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/books")
    public ResponseEntity<List<BookResponse>> getAllBooks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            Authentication auth) {
        String collegeId = (String) auth.getCredentials();

        if (search != null && !search.isBlank()) {
            List<BookResponse> byTitle = bookService.searchByTitle(collegeId, search);
            List<BookResponse> byAuthor = bookService.searchByAuthor(collegeId, search);
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
}
