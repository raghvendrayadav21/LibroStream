package com.smartlms.repository;

import com.smartlms.model.College;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CollegeRepository extends MongoRepository<College, String> {

    /** Email domain se college dhundho (dynamic domain validation ke liye) */
    Optional<College> findFirstByAllowedEmailDomain(String domain);

    /** College code check karne ke liye (unique check during registration) */
    Optional<College> findByCollegeCode(String collegeCode);

    /** Admin email se college dhundho */
    Optional<College> findByAdminEmail(String adminEmail);

    /** Check karo ki domain already registered hai ya nahi */
    boolean existsByAllowedEmailDomain(String domain);

    /** Check karo ki college code already taken hai ya nahi */
    boolean existsByCollegeCode(String collegeCode);

    /** Check karo ki college name already registered hai ya nahi (case-insensitive) */
    boolean existsByCollegeNameIgnoreCase(String collegeName);
}
