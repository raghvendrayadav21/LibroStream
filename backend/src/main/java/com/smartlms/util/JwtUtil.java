package com.smartlms.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT Utility - Token generate, validate aur parse karne ke liye
 *
 * JWT Token ke andar yeh info hoti hai (payload):
 * - sub     → user email
 * - role    → STUDENT ya FACULTY_ADMIN
 * - college → collegeId (multi-tenancy ke liye)
 * - iat     → issued at (kab bana)
 * - exp     → expiry (kab expire hoga)
 */
@Slf4j
@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    // ========== TOKEN GENERATE ==========

    /**
     * Login ke baad yeh method call hota hai
     * Email, role aur collegeId se ek signed JWT token banata hai
     */
    public String generateToken(String email, String role, String collegeId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("collegeId", collegeId);

        return Jwts.builder()
                .claims(claims)
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    // ========== TOKEN VALIDATE ==========

    /**
     * Token valid hai ya nahi check karta hai
     * Expired ya tampered token pe false return karega
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    // ========== TOKEN PARSE ==========

    /** Token se email (subject) nikalo */
    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    /** Token se role nikalo */
    public String extractRole(String token) {
        return (String) extractClaims(token).get("role");
    }

    /** Token se collegeId nikalo */
    public String extractCollegeId(String token) {
        return (String) extractClaims(token).get("collegeId");
    }

    // ========== PRIVATE HELPERS ==========

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
