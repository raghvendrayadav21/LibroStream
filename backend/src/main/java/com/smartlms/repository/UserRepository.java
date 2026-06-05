package com.smartlms.repository;

import com.smartlms.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /** Email se user dhundho (login ke liye) */
    Optional<User> findByEmail(String email);

    /** Kisi college ke saare students/admins */
    List<User> findByCollegeId(String collegeId);

    /** Kisi college ke sirf students */
    List<User> findByCollegeIdAndRole(String collegeId, String role);

    /** Email exist karta hai ya nahi (registration duplicate check) */
    boolean existsByEmail(String email);

    /** Library card number se user dhundho (QR scan ke baad) */
    Optional<User> findByLibraryCardNumber(String libraryCardNumber);

    /** College ke active students count ke liye */
    long countByCollegeIdAndRole(String collegeId, String role);
}
