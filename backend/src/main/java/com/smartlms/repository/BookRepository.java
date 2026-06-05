package com.smartlms.repository;

import com.smartlms.model.Book;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends MongoRepository<Book, String> {

    /** Ek college ki saari books */
    List<Book> findByCollegeId(String collegeId);

    /** Category se filter (e.g., "Computer Science") */
    List<Book> findByCollegeIdAndCategory(String collegeId, String category);

    /** Available books (issue ke liye) */
    List<Book> findByCollegeIdAndAvailableCopiesGreaterThan(String collegeId, int copies);

    /** Title me search (case-insensitive) */
    List<Book> findByCollegeIdAndTitleContainingIgnoreCase(String collegeId, String title);

    /** Author se search */
    List<Book> findByCollegeIdAndAuthorContainingIgnoreCase(String collegeId, String author);

    /** College ke total books count */
    long countByCollegeId(String collegeId);
}
