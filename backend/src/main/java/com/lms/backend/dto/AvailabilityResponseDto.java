package com.lms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityResponseDto {
    private String resourceId;
    private String resourceName;
    private LocalDate date;
    private boolean available;
    private List<AvailabilitySlot> availableSlots;
    private List<ConflictInfo> conflicts;
    private List<String> availabilityWindows;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilitySlot {
        private LocalTime startTime;
        private LocalTime endTime;
        private boolean available;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConflictInfo {
        private String bookingId;
        private String purpose;
        private LocalTime startTime;
        private LocalTime endTime;
        private String status;
    }
}
