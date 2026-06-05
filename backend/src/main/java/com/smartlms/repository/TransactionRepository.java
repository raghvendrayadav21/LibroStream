package com.smartlms.repository;

import com.smartlms.model.BookTransaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends MongoRepository<BookTransaction, String> {

    /** Ek student ki saari transactions (My Books page ke liye) */
    List<BookTransaction> findByStudentId(String studentId);

    /** Ek student ki active transactions (ISSUED ya OVERDUE) */
    List<BookTransaction> findByStudentIdAndStatusIn(String studentId, List<String> statuses);

    /** Ek college ki saari transactions (admin view) */
    List<BookTransaction> findByCollegeId(String collegeId);

    /** College ki transactions by status */
    List<BookTransaction> findByCollegeIdAndStatus(String collegeId, String status);

    /**
     * Scheduler ke liye: un transactions ko dhundho jo ISSUED hain
     * aur jinki dueDate aaj se pehle nikal gayi
     * (ye OVERDUE mark hone chahiye)
     */
    List<BookTransaction> findByStatusAndDueDateBefore(String status, LocalDate date);

    /**
     * Specific college ke overdue transactions
     * (email reminder bhejne ke liye)
     */
    List<BookTransaction> findByCollegeIdAndStatusAndDueDateBefore(
            String collegeId, String status, LocalDate date);

    /** Ek student ne abhi koi book li hui hai ya nahi */
    boolean existsByStudentIdAndBookIdAndStatus(String studentId, String bookId, String status);

    /** College ki issued books count (dashboard stats) */
    long countByCollegeIdAndStatus(String collegeId, String status);

    /** College ki returned today books count (dashboard stats) */
    long countByCollegeIdAndStatusAndReturnDate(String collegeId, String status, LocalDate returnDate);
}
