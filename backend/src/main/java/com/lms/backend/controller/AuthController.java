package com.lms.backend.controller;

import com.lms.backend.dto.LoginRequest;
import com.lms.backend.dto.RegisterRequest;
import com.lms.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    private ResponseEntity<?> createCookieResponse(com.lms.backend.dto.AuthResponse res) {
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("token", res.getToken())
                .httpOnly(true)
                .secure(true) // Enforced Secure required for None
                .path("/")
                .maxAge(86400)
                .sameSite("None") // Enabled Cross-Site delivery for Vercel -> Railway
                .build();
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString())
                .body(res);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            return createCookieResponse(authService.register(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register/admin")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody RegisterRequest request) {
        try {
            return createCookieResponse(authService.registerWithRole(request, "ROLE_ADMIN"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register/lecturer")
    public ResponseEntity<?> registerLecturer(@Valid @RequestBody RegisterRequest request) {
        try {
            return createCookieResponse(authService.registerWithRole(request, "ROLE_LECTURER"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            return createCookieResponse(authService.login(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid email or password");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("token", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite("None")
                .build();
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString())
                .body("Logged out successfully");
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody com.lms.backend.dto.GoogleAuthRequest request) {
        try {
            return createCookieResponse(authService.loginWithGoogle(request.getCredential()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Google authentication failed: " + e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
                return ResponseEntity.status(401).body("Not authenticated");
            }
            com.lms.backend.model.User user = (com.lms.backend.model.User) auth.getPrincipal();
            return ResponseEntity.ok(java.util.Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "roles", user.getRoles() != null ? user.getRoles() : java.util.List.of("ROLE_STUDENT")
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }
}
