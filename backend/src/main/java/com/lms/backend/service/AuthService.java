package com.lms.backend.service;

import com.lms.backend.dto.AuthResponse;
import com.lms.backend.dto.LoginRequest;
import com.lms.backend.dto.RegisterRequest;
import com.lms.backend.model.User;
import com.lms.backend.repository.UserRepository;
import com.lms.backend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

        private final UserRepository userRepository;
        private final PasswordResetTokenRepository tokenRepository;
        private final EmailService emailService;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtils jwtUtils;
        private final AuthenticationManager authenticationManager;

        public AuthResponse register(RegisterRequest request) {
                return registerWithRole(request, "ROLE_STUDENT");
        }

        public AuthResponse registerWithRole(RegisterRequest request, String role) {
                if (userRepository.existsByEmail(request.getEmail())) {
                        throw new RuntimeException("Email is already registered");
                }

                var user = User.builder()
                                .name(request.getName())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .roles(java.util.List.of(role))
                                .build();
                userRepository.save(user);

                var jwtToken = jwtUtils.generateToken(user);
                return AuthResponse.builder()
                                .token(jwtToken)
                                .message("User registered successfully")
                                .name(user.getName())
                                .email(user.getEmail())
                                .roles(user.getRoles())
                                .build();
        }

        public AuthResponse login(LoginRequest request) {
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getEmail(),
                                                request.getPassword()));
                var user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new RuntimeException("User not found"));
                var jwtToken = jwtUtils.generateToken(user);
                return AuthResponse.builder()
                                .token(jwtToken)
                                .message("Login successful")
                                .name(user.getName())
                                .email(user.getEmail())
                                .roles(user.getRoles())
                                .build();
        }

        @org.springframework.beans.factory.annotation.Value("${google.client.id:PLACEHOLDER}")
        private String googleClientId;

        public AuthResponse loginWithGoogle(String credential) throws Exception {
                com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier verifier = new com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier.Builder(
                                new com.google.api.client.http.javanet.NetHttpTransport(),
                                new com.google.api.client.json.gson.GsonFactory())
                                .setAudience(java.util.Collections.singletonList(googleClientId))
                                .build();

                com.google.api.client.googleapis.auth.oauth2.GoogleIdToken idToken = verifier.verify(credential);
                if (idToken != null) {
                        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = idToken
                                        .getPayload();
                        String email = payload.getEmail();
                        String name = (String) payload.get("name");

                        User user = userRepository.findByEmail(email).orElseGet(() -> {
                                User newUser = User.builder()
                                                .name(name)
                                                .email(email)
                                                .password(passwordEncoder
                                                                .encode(java.util.UUID.randomUUID().toString()))
                                                .roles(java.util.List.of("ROLE_STUDENT"))
                                                .build();
                                return userRepository.save(newUser);
                        });

                        String jwtToken = jwtUtils.generateToken(user);
                        return AuthResponse.builder()
                                        .token(jwtToken)
                                        .message("Google Login successful")
                                        .name(user.getName())
                                        .email(user.getEmail())
                                        .roles(user.getRoles())
                                        .build();
                } else {
                        throw new RuntimeException("Invalid ID token.");
                }
        }

        public void processForgotPassword(String email) {
                var user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Delete any existing tokens for this user
                tokenRepository.deleteByEmail(email);

                String token = java.util.UUID.randomUUID().toString();
                var resetToken = com.lms.backend.model.PasswordResetToken.builder()
                                .token(token)
                                .email(email)
                                .expiryDate(new java.util.Date(System.currentTimeMillis() + 3600000)) // 1 hour
                                .build();
                tokenRepository.save(resetToken);

                emailService.sendPasswordResetEmail(email, token);
        }

        public void resetPassword(String token, String newPassword) {
                var resetToken = tokenRepository.findByToken(token)
                                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

                if (resetToken.getExpiryDate().before(new java.util.Date())) {
                        tokenRepository.delete(resetToken);
                        throw new RuntimeException("Token has expired");
                }

                var user = userRepository.findByEmail(resetToken.getEmail())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);

                tokenRepository.delete(resetToken);
        }
}
