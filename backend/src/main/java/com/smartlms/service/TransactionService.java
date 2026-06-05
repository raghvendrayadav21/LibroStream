package com.smartlms.service;

import com.smartlms.dto.BookDto.*;
import com.smartlms.model.Book;
import com.smartlms.model.BookTransaction;
import com.smartlms.model.College;
import com.smartlms.model.User;
import com.smartlms.repository.BookRepository;
import com.smartlms.repository.CollegeRepository;
import com.smartlms.repository.TransactionRepository;
import com.smartlms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Transaction Service - Book Issue, Return aur Penalty Logic
 *
 * CORE BUSINESS LOGIC:
 * 1. Book Issue: transaction create + availableCopies -1
 * 2. Book Return: returnDate set + status RETURNED + final penalty calculate + availableCopies +1
 * 3. Live Penalty: dueDate ke baad har din ₹penaltyPerDay
 * 4. Overdue Mark: scheduler daily yeh call karta hai
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final CollegeRepository collegeRepository;

    // =====================================================================
    //  BOOK ISSUE
    //  Faculty admin: Student ka QR scan → bookId enter → Issue
    // =====================================================================
    public TransactionResponse issueBook(String collegeId, IssueBookRequest request) {

        // Book dhundho
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new RuntimeException("Book not found: " + request.getBookId()));

        // Book usi college ki hai?
        if (!book.getCollegeId().equals(collegeId)) {
            throw new RuntimeException("Book does not belong to this college.");
        }

        // Available copies hain?
        if (book.getAvailableCopies() <= 0) {
            throw new RuntimeException("No copies available for: " + book.getTitle());
        }

        // Student dhundho
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found: " + request.getStudentId()));

        // Student ne yeh book pehle se issue ki hui hai?
        if (transactionRepository.existsByStudentIdAndBookIdAndStatus(
                request.getStudentId(), request.getBookId(), "ISSUED")) {
            throw new RuntimeException("Student already has this book issued.");
        }

        // College settings se due date calculate karo
        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new RuntimeException("College not found"));

        LocalDate today = LocalDate.now();
        LocalDate dueDate = today.plusDays(college.getLoanDurationDays());

        // Transaction banao
        BookTransaction transaction = BookTransaction.builder()
                .collegeId(collegeId)
                .studentId(student.getId())
                .studentName(student.getName())
                .studentEmail(student.getEmail())
                .bookId(book.getId())
                .bookTitle(book.getTitle())
                .bookAuthor(book.getAuthor())
                .issueDate(today)
                .dueDate(dueDate)
                .returnDate(null)
                .status("ISSUED")
                .penaltyAmount(0.0)
                .issuedAt(LocalDateTime.now())
                .build();

        transaction = transactionRepository.save(transaction);

        // Book ki available copies 1 kam karo
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        log.info("Book issued: '{}' to '{}' (due: {})", book.getTitle(), student.getName(), dueDate);
        return buildTransactionResponse(transaction, college.getPenaltyPerDay());
    }

    // =====================================================================
    //  BOOK RETURN
    //  Faculty: return karo → final penalty calculate → book available++
    // =====================================================================
    public TransactionResponse returnBook(String collegeId, String transactionId) {

        BookTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));

        if (!transaction.getCollegeId().equals(collegeId)) {
            throw new RuntimeException("Transaction does not belong to this college.");
        }

        if ("RETURNED".equals(transaction.getStatus())) {
            throw new RuntimeException("This book is already returned.");
        }

        // College ke penalty settings
        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new RuntimeException("College not found"));

        LocalDate today = LocalDate.now();

        // Final penalty calculate karo
        double finalPenalty = calculateLivePenalty(transaction.getDueDate(), today, college.getPenaltyPerDay());

        // Transaction update karo
        transaction.setReturnDate(today);
        transaction.setStatus("RETURNED");
        transaction.setPenaltyAmount(finalPenalty);
        transactionRepository.save(transaction);

        // Book ki available copies 1 badhao
        Book book = bookRepository.findById(transaction.getBookId())
                .orElseThrow(() -> new RuntimeException("Book not found"));
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);

        log.info("Book returned: '{}' by '{}', Final penalty: ₹{}",
                transaction.getBookTitle(), transaction.getStudentName(), finalPenalty);

        return buildTransactionResponse(transaction, college.getPenaltyPerDay());
    }

    // =====================================================================
    //  STUDENT KI ISSUED BOOKS (My Books page)
    // =====================================================================
    public List<TransactionResponse> getStudentActiveBooks(String studentId, String collegeId) {
        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new RuntimeException("College not found"));

        return transactionRepository.findByStudentIdAndStatusIn(
                        studentId, List.of("ISSUED", "OVERDUE"))
                .stream()
                .map(t -> buildTransactionResponse(t, college.getPenaltyPerDay()))
                .collect(Collectors.toList());
    }

    // =====================================================================
    //  STUDENT KI ALL TRANSACTIONS (history bhi)
    // =====================================================================
    public List<TransactionResponse> getStudentAllTransactions(String studentId, String collegeId) {
        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new RuntimeException("College not found"));

        return transactionRepository.findByStudentId(studentId)
                .stream()
                .map(t -> buildTransactionResponse(t, college.getPenaltyPerDay()))
                .collect(Collectors.toList());
    }

    // =====================================================================
    //  COLLEGE KI ALL TRANSACTIONS (Admin view)
    // =====================================================================
    public List<TransactionResponse> getAllCollegeTransactions(String collegeId) {
        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new RuntimeException("College not found"));

        return transactionRepository.findByCollegeId(collegeId)
                .stream()
                .map(t -> buildTransactionResponse(t, college.getPenaltyPerDay()))
                .collect(Collectors.toList());
    }

    // =====================================================================
    //  CLEAR / WAIVE PENALTY
    //  Faculty: penalty zero karo (waive karo)
    // =====================================================================
    public TransactionResponse clearPenalty(String collegeId, String transactionId) {
        BookTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));

        if (!transaction.getCollegeId().equals(collegeId)) {
            throw new RuntimeException("Transaction does not belong to this college.");
        }

        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new RuntimeException("College not found"));

        if (!"RETURNED".equals(transaction.getStatus())) {
            // Return the book and clear penalty
            transaction.setReturnDate(LocalDate.now());
            transaction.setStatus("RETURNED");
            transaction.setPenaltyAmount(0.0);
            transactionRepository.save(transaction);

            // Increment book count
            Book book = bookRepository.findById(transaction.getBookId()).orElse(null);
            if (book != null) {
                book.setAvailableCopies(book.getAvailableCopies() + 1);
                bookRepository.save(book);
            }
        } else {
            // Already returned, just clear the penalty
            transaction.setPenaltyAmount(0.0);
            transactionRepository.save(transaction);
        }

        log.info("Penalty cleared for transaction: {} of college: {}", transactionId, collegeId);
        return buildTransactionResponse(transaction, college.getPenaltyPerDay());
    }

    // =====================================================================
    //  OVERDUE MARK (Scheduler call karta hai - daily)
    //  ISSUED transactions jinka dueDate nikal gaya unhe OVERDUE mark karo
    // =====================================================================
    public int markOverdueTransactions() {
        LocalDate today = LocalDate.now();
        List<BookTransaction> overdueTransactions =
                transactionRepository.findByStatusAndDueDateBefore("ISSUED", today);

        for (BookTransaction t : overdueTransactions) {
            t.setStatus("OVERDUE");
            transactionRepository.save(t);
        }

        log.info("Marked {} transactions as OVERDUE", overdueTransactions.size());
        return overdueTransactions.size();
    }

    // =====================================================================
    //  LIVE PENALTY CALCULATION (pure calculation, no DB write)
    // =====================================================================
    public static double calculateLivePenalty(LocalDate dueDate, LocalDate checkDate, double penaltyPerDay) {
        if (checkDate.isAfter(dueDate)) {
            long daysLate = ChronoUnit.DAYS.between(dueDate, checkDate);
            return daysLate * penaltyPerDay;
        }
        return 0.0;
    }

    // =====================================================================
    //  PRIVATE: TransactionResponse BUILD KARO
    // =====================================================================
    private TransactionResponse buildTransactionResponse(BookTransaction t, double penaltyPerDay) {
        TransactionResponse resp = new TransactionResponse();
        resp.setId(t.getId());
        resp.setStudentId(t.getStudentId());
        resp.setStudentName(t.getStudentName());
        resp.setStudentEmail(t.getStudentEmail());
        resp.setBookId(t.getBookId());
        resp.setBookTitle(t.getBookTitle());
        resp.setBookAuthor(t.getBookAuthor());
        resp.setIssueDate(t.getIssueDate());
        resp.setDueDate(t.getDueDate());
        resp.setReturnDate(t.getReturnDate());
        resp.setStatus(t.getStatus());
        resp.setPenaltyAmount(t.getPenaltyAmount()); // Final (returned transactions ke liye)

        // Live penalty calculate karo (sirf active transactions ke liye)
        if (!"RETURNED".equals(t.getStatus()) && t.getDueDate() != null) {
            LocalDate today = LocalDate.now();
            double livePenalty = calculateLivePenalty(t.getDueDate(), today, penaltyPerDay);
            resp.setLivePenalty(livePenalty);
            resp.setOverdue(today.isAfter(t.getDueDate()));

            if (today.isAfter(t.getDueDate())) {
                resp.setDaysLate(ChronoUnit.DAYS.between(t.getDueDate(), today));
            }
        }

        return resp;
    }
}
