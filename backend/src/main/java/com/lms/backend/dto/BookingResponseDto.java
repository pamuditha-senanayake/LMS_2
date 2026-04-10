package com.lms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponseDto {

    private String id;
    private String resourceId;
    private String resourceName;
    private String resourceType;
    private String resourceLocation;
    private Integer resourceCapacity;
    private UserSummaryDto requestedBy;
    private UserSummaryDto reviewedBy;
    private String purpose;
    private Integer expectedAttendees;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String type;
    private String status;
    private String rejectionReason;
    private LocalDateTime approvedAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<BookingHistoryDto> history;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummaryDto {
        private String userId;
        private String name;
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingHistoryDto {
        private String id;
        private String oldStatus;
        private String newStatus;
        private String changedByName;
        private String changedById;
        private String note;
        private LocalDateTime changedAt;
    }
}
