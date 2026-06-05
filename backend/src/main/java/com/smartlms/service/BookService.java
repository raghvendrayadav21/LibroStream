package com.smartlms.service;

import com.smartlms.dto.BookDto.*;
import com.smartlms.model.Book;
import com.smartlms.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Book Service - Library book inventory management
 *
 * OPERATIONS:
 * 1. Single book add
 * 2. Bulk books add (JSON array)
 * 3. Book search (title/author/category)
 * 4. Book details fetch
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    // =====================================================================
    //  SINGLE BOOK ADD
    // =====================================================================
    public BookResponse addBook(String collegeId, BookRequest request) {
        Book book = Book.builder()
                .collegeId(collegeId)
                .title(request.getTitle())
                .author(request.getAuthor())
                .isbn(request.getIsbn())
                .category(request.getCategory())
                .totalCopies(request.getTotalCopies())
                .availableCopies(request.getTotalCopies()) // Sari copies initially available
                .shelfLocation(request.getShelfLocation())
                .description(request.getDescription())
                .addedAt(LocalDateTime.now())
                .build();

        book = bookRepository.save(book);
        log.info("Book added: '{}' for college: {}", book.getTitle(), collegeId);
        return toBookResponse(book);
    }

    // =====================================================================
    //  BULK BOOKS ADD (List of BookRequest)
    // =====================================================================
    public List<BookResponse> addBulkBooks(String collegeId, List<BookRequest> requests) {
        List<Book> books = requests.stream()
                .map(req -> Book.builder()
                        .collegeId(collegeId)
                        .title(req.getTitle())
                        .author(req.getAuthor())
                        .isbn(req.getIsbn())
                        .category(req.getCategory())
                        .totalCopies(req.getTotalCopies())
                        .availableCopies(req.getTotalCopies())
                        .shelfLocation(req.getShelfLocation())
                        .description(req.getDescription())
                        .addedAt(LocalDateTime.now())
                        .build())
                .collect(Collectors.toList());

        books = bookRepository.saveAll(books);
        log.info("Bulk added {} books for college: {}", books.size(), collegeId);
        return books.stream().map(this::toBookResponse).collect(Collectors.toList());
    }

    // =====================================================================
    //  ALL BOOKS (College ka inventory)
    // =====================================================================
    public List<BookResponse> getAllBooks(String collegeId) {
        return bookRepository.findByCollegeId(collegeId)
                .stream()
                .map(this::toBookResponse)
                .collect(Collectors.toList());
    }

    // =====================================================================
    //  SEARCH BOOKS
    // =====================================================================
    public List<BookResponse> searchByTitle(String collegeId, String title) {
        return bookRepository.findByCollegeIdAndTitleContainingIgnoreCase(collegeId, title)
                .stream().map(this::toBookResponse).collect(Collectors.toList());
    }

    public List<BookResponse> searchByAuthor(String collegeId, String author) {
        return bookRepository.findByCollegeIdAndAuthorContainingIgnoreCase(collegeId, author)
                .stream().map(this::toBookResponse).collect(Collectors.toList());
    }

    public List<BookResponse> filterByCategory(String collegeId, String category) {
        return bookRepository.findByCollegeIdAndCategory(collegeId, category)
                .stream().map(this::toBookResponse).collect(Collectors.toList());
    }

    // =====================================================================
    //  SINGLE BOOK DETAILS
    // =====================================================================
    public BookResponse getBookById(String bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found: " + bookId));
        return toBookResponse(book);
    }

    // =====================================================================
    //  UPDATE BOOK
    // =====================================================================
    public BookResponse updateBook(String collegeId, String bookId, BookRequest request) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found: " + bookId));
        
        if (!book.getCollegeId().equals(collegeId)) {
            throw new RuntimeException("Unauthorized: Book does not belong to this college.");
        }

        int borrowedCopies = book.getTotalCopies() - book.getAvailableCopies();
        int newTotal = request.getTotalCopies();
        if (newTotal < borrowedCopies) {
            throw new RuntimeException("Cannot reduce total copies below currently borrowed copies (" + borrowedCopies + ")");
        }

        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setIsbn(request.getIsbn());
        book.setCategory(request.getCategory());
        book.setTotalCopies(newTotal);
        book.setAvailableCopies(newTotal - borrowedCopies);
        book.setShelfLocation(request.getShelfLocation());
        book.setDescription(request.getDescription());

        book = bookRepository.save(book);
        log.info("Book updated: '{}' for college: {}", book.getTitle(), collegeId);
        return toBookResponse(book);
    }

    // =====================================================================
    //  DELETE BOOK
    // =====================================================================
    public void deleteBook(String collegeId, String bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found: " + bookId));
        if (!book.getCollegeId().equals(collegeId)) {
            throw new RuntimeException("Unauthorized: Book does not belong to this college.");
        }
        bookRepository.deleteById(bookId);
        log.info("Book deleted: {} from college: {}", bookId, collegeId);
    }

    // =====================================================================
    //  PRIVATE: Model → DTO convert
    // =====================================================================
    private BookResponse toBookResponse(Book book) {
        BookResponse resp = new BookResponse();
        resp.setId(book.getId());
        resp.setTitle(book.getTitle());
        resp.setAuthor(book.getAuthor());
        resp.setIsbn(book.getIsbn());
        resp.setCategory(book.getCategory());
        resp.setTotalCopies(book.getTotalCopies());
        resp.setAvailableCopies(book.getAvailableCopies());
        resp.setShelfLocation(book.getShelfLocation());
        resp.setDescription(book.getDescription());
        resp.setAvailable(book.getAvailableCopies() > 0);
        return resp;
    }
}
