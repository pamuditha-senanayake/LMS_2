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
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    
    private String recipientUserId;
    private String createdById;
    
    private String notificationType;
    private String title;
    private String message;
    
    private String relatedEntityType;
    private String relatedEntityId;
    
    private Boolean isRead;
    private LocalDateTime readAt;
    
    @CreatedDate
    private LocalDateTime createdAt;
}
