package com.smartlms.controller;

import com.smartlms.dto.CollegeDto.*;
import com.smartlms.model.College;
import com.smartlms.service.CollegeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/college")
@RequiredArgsConstructor
public class CollegeController {

    private final CollegeService collegeService;

    @PostMapping("/register")
    public ResponseEntity<?> registerCollege(@Valid @RequestBody CollegeRegisterRequest request) {
        try {
            CollegeResponse response = collegeService.registerCollege(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            err.put("success", false);
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            log.error("College registration error: {}", e.getMessage());
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Registration failed. Please try again.");
            err.put("success", false);
            return ResponseEntity.internalServerError().body(err);
        }
    }

    @GetMapping("/check-code")
    public ResponseEntity<?> checkCollegeCode(@RequestParam String code) {
        boolean available = collegeService.isCollegeCodeAvailable(code);
        Map<String, Object> resp = new HashMap<>();
        resp.put("code", code.toUpperCase());
        resp.put("available", available);
        resp.put("message", available ? "College code is available!" : "Code already taken.");
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/check-name")
    public ResponseEntity<?> checkCollegeName(@RequestParam String name) {
        boolean available = collegeService.isCollegeNameAvailable(name);
        Map<String, Object> resp = new HashMap<>();
        resp.put("name", name);
        resp.put("available", available);
        resp.put("message", available ? "College name is available!" : "College name already exists.");
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/domain")
    public ResponseEntity<?> getCollegeByEmail(@RequestParam String email) {
        Optional<College> found = collegeService.getCollegeByEmailDomain(email);
        if (found.isPresent()) {
            College college = found.get();
            Map<String, Object> resp = new HashMap<>();
            resp.put("found", true);
            resp.put("collegeName", college.getCollegeName());
            resp.put("collegeCode", college.getCollegeCode());
            resp.put("allowedDomain", college.getAllowedEmailDomain());
            resp.put("logoBase64", college.getLogoBase64() != null ? college.getLogoBase64() : "");
            return ResponseEntity.ok(resp);
        } else {
            Map<String, Object> resp = new HashMap<>();
            resp.put("found", false);
            resp.put("message", "No college registered for this email domain.");
            return ResponseEntity.ok(resp);
        }
    }

    @GetMapping("/info")
    @PreAuthorize("hasRole('FACULTY_ADMIN')")
    public ResponseEntity<CollegeResponse> getCollegeInfo(Authentication auth) {
        String collegeId = (String) auth.getCredentials();
        return ResponseEntity.ok(collegeService.getCollegeInfo(collegeId));
    }

    @PutMapping("/settings")
    @PreAuthorize("hasRole('FACULTY_ADMIN')")
    public ResponseEntity<?> updateSettings(@RequestBody CollegeSettingsRequest request,
                                            Authentication auth) {
        try {
            String collegeId = (String) auth.getCredentials();
            CollegeResponse response = collegeService.updateCollegeSettings(collegeId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
