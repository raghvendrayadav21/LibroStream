package com.smartlms.config;

import com.smartlms.filter.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security Configuration
 *
 * - JWT-based stateless authentication (no sessions)
 * - Role-based access control (STUDENT vs FACULTY_ADMIN)
 * - CORS allowed for React frontend (localhost:5173)
 * - BCrypt password encoding
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // @PreAuthorize annotations enable karta hai Controllers me
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Value("${app.cors.allowed.origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CSRF disable (JWT use kar rahe hain, cookies nahi)
            .csrf(AbstractHttpConfigurer::disable)

            // CORS configure
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Session management: STATELESS (JWT ke sath session ki zaroorat nahi)
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // URL-based authorization rules
            .authorizeHttpRequests(auth -> auth
                // ---- PUBLIC ENDPOINTS (No token needed) ----
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/college/register").permitAll()
                .requestMatchers("/api/college/check-code").permitAll()
                .requestMatchers("/api/college/check-name").permitAll()
                .requestMatchers("/api/college/domain").permitAll()

                // ---- STUDENT ENDPOINTS ----
                .requestMatchers("/api/student/**").hasRole("STUDENT")

                // ---- ADMIN ENDPOINTS ----
                .requestMatchers("/api/admin/**").hasRole("FACULTY_ADMIN")

                // ---- COLLEGE SETTINGS (Admin only) ----
                .requestMatchers("/api/college/**").hasRole("FACULTY_ADMIN")

                // Baki sab endpoints ke liye authentication required
                .anyRequest().authenticated()
            )

            // JWT filter add karo (Spring ke default filter se pehle)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt — industry standard password hashing
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // React frontend ke origins allow karo
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        config.setAllowedOrigins(origins);

        // HTTP methods
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Headers
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With"));

        // Credentials (cookies agar future me chahiye)
        config.setAllowCredentials(true);

        // Preflight cache duration
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
