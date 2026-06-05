package com.smartlms.service;

import com.smartlms.model.User;
import com.smartlms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim());
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    /**
     * Toggles a student's active status (block/unblock)
     * Must be verified to belong to the same collegeId.
     */
    public Optional<User> toggleStudentStatus(String studentId, String collegeId) {
        Optional<User> userOpt = userRepository.findById(studentId);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        User user = userOpt.get();
        if (!user.getCollegeId().equals(collegeId)) {
            log.warn("Unauthorized status toggle attempt: user {} from college {} by admin of college {}", 
                    studentId, user.getCollegeId(), collegeId);
            return Optional.empty();
        }

        if (!"STUDENT".equals(user.getRole())) {
            log.warn("Attempt to toggle status of non-student: user {}", studentId);
            return Optional.empty();
        }

        user.setActive(!user.isActive());
        User updatedUser = userRepository.save(user);
        log.info("Student status toggled. ID: {}, active: {}", studentId, updatedUser.isActive());
        return Optional.of(updatedUser);
    }

    public boolean updatePassword(String email, String newPassword) {
        Optional<User> userOpt = userRepository.findByEmail(email.toLowerCase().trim());
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password updated successfully for email: {}", email);
        return true;
    }

    /**
     * Unique Library Card Number generate karo: "LIB-2026-F93A8B12"
     */
    public String generateUniqueLibraryCardNumber() {
        int year = Year.now().getValue();
        String uniquePart = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String cardNumber = "LIB-" + year + "-" + uniquePart;

        // Uniqueness check
        while (userRepository.findByLibraryCardNumber(cardNumber).isPresent()) {
            uniquePart = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            cardNumber = "LIB-" + year + "-" + uniquePart;
        }
        return cardNumber;
    }
}
