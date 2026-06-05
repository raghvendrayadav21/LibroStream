package com.smartlms.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Book Document - MongoDB 'books' collection
 * 
 * Ek book entry sirf ek title represent karti hai (na ki individual copy).
 * Copies ka count totalCopies aur availableCopies fields se track hota hai.
 * Jab book issue hoti hai: availableCopies - 1
 * Jab book return hoti hai: availableCopies + 1
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "books")
public class Book {

    @Id
    private String id;

    /** Tenant scoping — sirf is college ke books dikhenge */
    private String collegeId;

    /** Book ka poora title */
    private String title;

    /** Author ka naam */
    private String author;

    /** ISBN number (optional but useful) */
    private String isbn;

    /** Category/Subject, e.g., "Computer Science", "Mathematics", "Physics" */
    private String category;

    /** Is library me is book ki total kitni copies hain */
    private int totalCopies;

    /**
     * Abhi kitni copies available hain (issue ke liye)
     * Yeh dynamically update hoti hai jab book issue ya return hoti hai
     */
    private int availableCopies;

    /** Shelf/Rack location, e.g., "Rack-B3", "Shelf-A2" */
    private String shelfLocation;

    /** Book ki description (optional) */
    private String description;

    /** Kab add ki gayi library me */
    @CreatedDate
    private LocalDateTime addedAt;
}
