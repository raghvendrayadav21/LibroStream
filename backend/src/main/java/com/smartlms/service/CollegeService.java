package com.smartlms.service;

import com.smartlms.dto.CollegeDto.*;
import com.smartlms.model.College;
import com.smartlms.model.User;
import com.smartlms.repository.BookRepository;
import com.smartlms.repository.CollegeRepository;
import com.smartlms.repository.TransactionRepository;
import com.smartlms.repository.UserRepository;
import com.smartlms.util.JwtUtil;
import com.smartlms.util.QRCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.Optional;
import java.util.Random;

/**
 * College Service - Multi-tenant college onboarding aur management
 *
 * KEY OPERATIONS:
 * 1. College register karna (3-step wizard)
 * 2. Admin account create karna (automatically FACULTY_ADMIN role)
 * 3. College settings update karna
 * 4. Dashboard stats fetch karna
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CollegeService {

    private final CollegeRepository collegeRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;
    private final QRCodeGenerator qrCodeGenerator;
    private final JwtUtil jwtUtil;

    private final Random random = new Random();

    // =====================================================================
    //  COLLEGE REGISTER (3-step wizard ka final submit)
    // =====================================================================
    public CollegeResponse registerCollege(CollegeRegisterRequest request) {

        // Validation: College code unique hai?
        if (collegeRepository.existsByCollegeCode(request.getCollegeCode().toUpperCase())) {
            throw new IllegalArgumentException("College code '" + request.getCollegeCode() + "' already taken.");
        }

        // Validation: Email domain unique hai?
        String domain = request.getAllowedEmailDomain().toLowerCase().trim();
        if (!domain.startsWith("@")) domain = "@" + domain;
        if (!domain.equals("@gmail.com") && collegeRepository.existsByAllowedEmailDomain(domain)) {
            throw new IllegalArgumentException("Email domain '" + domain + "' already registered.");
        }

        // College object banao
        College college = College.builder()
                .collegeName(request.getCollegeName())
                .collegeCode(request.getCollegeCode().toUpperCase())
                .allowedEmailDomain(domain)
                .address(request.getAddress())
                .city(request.getCity())
                .adminEmail(request.getAdminEmail().toLowerCase())
                .logoBase64(request.getLogoBase64())
                .penaltyPerDay(request.getPenaltyPerDay())
                .loanDurationDays(request.getLoanDurationDays())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        college = collegeRepository.save(college);

        // Admin user account banao (automatically FACULTY_ADMIN)
        String adminLibraryCard = "ADM-" + Year.now().getValue() + "-" + (1000 + random.nextInt(9000));
        User adminUser = User.builder()
                .collegeId(college.getId())
                .name(request.getAdminName())
                .email(request.getAdminEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getAdminPassword()))
                .role("FACULTY_ADMIN")
                .libraryCardNumber(adminLibraryCard)
                .isActive(true)  // Admin ko OTP verify nahi karna
                .build();

        // Admin ka QR code bhi generate karo
        adminUser = userRepository.save(adminUser);
        String adminQr = qrCodeGenerator.generateStudentQRCode(adminUser.getId(), adminLibraryCard);
        adminUser.setQrCodeBase64(adminQr);
        userRepository.save(adminUser);

        log.info("College registered: {} ({}), Admin: {}",
                college.getCollegeName(), college.getCollegeCode(), request.getAdminEmail());

        return buildCollegeResponse(college, 0L, 0L, 0L, 0L);
    }

    // =====================================================================
    //  COLLEGE INFO GET
    // =====================================================================
    public CollegeResponse getCollegeInfo(String collegeId) {
        College college = findCollegeById(collegeId);

        long totalStudents = userRepository.countByCollegeIdAndRole(collegeId, "STUDENT");
        long totalBooks = bookRepository.countByCollegeId(collegeId);
        long issuedBooks = transactionRepository.countByCollegeIdAndStatus(collegeId, "ISSUED");
        long overdueBooks = transactionRepository.countByCollegeIdAndStatus(collegeId, "OVERDUE");

        return buildCollegeResponse(college, totalStudents, totalBooks, issuedBooks, overdueBooks);
    }

    // =====================================================================
    //  COLLEGE SETTINGS UPDATE
    // =====================================================================
    public CollegeResponse updateCollegeSettings(String collegeId, CollegeSettingsRequest request) {
        College college = findCollegeById(collegeId);

        if (request.getCollegeName() != null) college.setCollegeName(request.getCollegeName());
        if (request.getAddress() != null) college.setAddress(request.getAddress());
        if (request.getCity() != null) college.setCity(request.getCity());
        if (request.getLogoBase64() != null) college.setLogoBase64(request.getLogoBase64());
        if (request.getPenaltyPerDay() > 0) college.setPenaltyPerDay(request.getPenaltyPerDay());
        if (request.getLoanDurationDays() > 0) college.setLoanDurationDays(request.getLoanDurationDays());

        // Domain update: check uniqueness (dusre college ne nahi liya)
        if (request.getAllowedEmailDomain() != null) {
            String newDomain = request.getAllowedEmailDomain().toLowerCase().trim();
            if (!newDomain.startsWith("@")) newDomain = "@" + newDomain;
            if (!newDomain.equals(college.getAllowedEmailDomain())) {
                if (!newDomain.equals("@gmail.com") && collegeRepository.existsByAllowedEmailDomain(newDomain)) {
                    throw new IllegalArgumentException("Domain already in use by another college.");
                }
                college.setAllowedEmailDomain(newDomain);
            }
        }

        college = collegeRepository.save(college);
        log.info("College settings updated: {}", collegeId);

        return getCollegeInfo(collegeId);
    }

    // =====================================================================
    //  CHECK COLLEGE CODE AVAILABILITY
    // =====================================================================
    public boolean isCollegeCodeAvailable(String code) {
        return !collegeRepository.existsByCollegeCode(code.toUpperCase());
    }

    // =====================================================================
    //  GET COLLEGE BY EMAIL DOMAIN (Login page ke liye)
    // =====================================================================
    public Optional<College> getCollegeByEmailDomain(String email) {
        String domain = email.substring(email.indexOf('@'));
        return collegeRepository.findFirstByAllowedEmailDomain(domain);
    }

    // =====================================================================
    //  PRIVATE HELPERS
    // =====================================================================
    private College findCollegeById(String collegeId) {
        return collegeRepository.findById(collegeId)
                .orElseThrow(() -> new RuntimeException("College not found: " + collegeId));
    }

    private CollegeResponse buildCollegeResponse(College college,
                                                   long totalStudents, long totalBooks,
                                                   long issuedBooks, long overdueBooks) {
        CollegeResponse resp = new CollegeResponse();
        resp.setId(college.getId());
        resp.setCollegeName(college.getCollegeName());
        resp.setCollegeCode(college.getCollegeCode());
        resp.setAllowedEmailDomain(college.getAllowedEmailDomain());
        resp.setAddress(college.getAddress());
        resp.setCity(college.getCity());
        resp.setAdminEmail(college.getAdminEmail());
        resp.setLogoBase64(college.getLogoBase64());
        resp.setPenaltyPerDay(college.getPenaltyPerDay());
        resp.setLoanDurationDays(college.getLoanDurationDays());
        resp.setActive(college.isActive());
        resp.setTotalStudents(totalStudents);
        resp.setTotalBooks(totalBooks);
        resp.setIssuedBooks(issuedBooks);
        resp.setOverdueBooks(overdueBooks);
        return resp;
    }
}
