package com.smartlms.filter;

import com.smartlms.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT Authentication Filter
 *
 * Har HTTP request ke aane par yeh filter chalega.
 * Request header me JWT token dhundhega, validate karega,
 * aur Spring Security context me user set kar dega.
 *
 * FLOW:
 * Request → JwtAuthFilter → Token check → Valid? → Security context set → Controller
 *                                        → Invalid? → 401 Unauthorized
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // Token header me hai ya nahi check karo
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // "Bearer " hata ke sirf token lo
        String token = authHeader.substring(7);

        try {
            if (jwtUtil.validateToken(token)) {
                String email = jwtUtil.extractEmail(token);
                String role = jwtUtil.extractRole(token);
                String collegeId = jwtUtil.extractCollegeId(token);

                // Role se Spring Security authority banao
                // "STUDENT" → "ROLE_STUDENT", "FACULTY_ADMIN" → "ROLE_FACULTY_ADMIN"
                List<SimpleGrantedAuthority> authorities =
                        List.of(new SimpleGrantedAuthority("ROLE_" + role));

                // Authentication object banao aur collegeId detail me store karo
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(email, collegeId, authorities);

                // Spring Security context me set karo
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            log.warn("JWT processing error: {}", e.getMessage());
            // Token invalid hai — context clear karo
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    /**
     * In paths ke liye filter bypass karo (public endpoints)
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/api/auth/") ||
               path.startsWith("/api/college/register") ||
               path.startsWith("/api/college/check-code") ||
               path.startsWith("/api/college/domain");
    }
}
