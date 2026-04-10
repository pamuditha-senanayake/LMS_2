package com.lms.backend.service;

public interface EmailService {
    void sendPasswordResetEmail(String to, String token);
}
