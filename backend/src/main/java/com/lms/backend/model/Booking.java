package com.lms.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookings")
public class Booking {
    @Id
    private String id;
    
    @NotBlank(message = "Resource ID is required")
    private String resourceId;
    private UserSummary requestedBy;
    private UserSummary reviewedBy;
    
    @NotBlank(message = "Purpose is required")
    private String purpose;

    @NotNull(message = "Expected attendees count is required")
    @Positive(message = "Expected attendees must be a positive number")
    private Integer expectedAttendees;
    
    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @NotBlank(message = "Type is required")
    private String type;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private String userId;
        private String name;
        private String email;
    }
    
    private String status; // PENDING, APPROVED, REJECTED, CANCELLED
    private String rejectionReason;
    
    private LocalDateTime approvedAt;
    private LocalDateTime cancelledAt;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
