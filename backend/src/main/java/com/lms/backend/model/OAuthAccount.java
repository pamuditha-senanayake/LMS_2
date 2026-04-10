package com.lms.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "oauth_accounts")
public class OAuthAccount {
    @Id
    private String id;
    
    private String userId;
    private String provider; // "google"
    private String providerUserId;
    private String email;
    
    private String accessTokenRef;
    private String refreshTokenRef;
    
    @CreatedDate
    private LocalDateTime linkedAt;
    
    private LocalDateTime lastLoginAt;
}
