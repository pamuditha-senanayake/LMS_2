package com.lms.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequestDto {

    @NotBlank(message = "Resource ID is required")
    private String resourceId;

    @NotBlank(message = "Purpose is required")
    private String purpose;

    @NotNull(message = "Expected attendees count is required")
    @Min(value = 1, message = "Expected attendees must be at least 1")
    private Integer expectedAttendees;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @NotBlank(message = "Booking type is required")
    private String type;

    private String requestedByUserId;
    private String requestedByName;
    private String requestedByEmail;
}
