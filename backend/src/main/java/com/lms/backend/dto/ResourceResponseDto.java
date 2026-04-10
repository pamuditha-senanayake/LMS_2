package com.lms.backend.dto;

import com.lms.backend.enums.ResourceCategory;
import com.lms.backend.enums.ResourceStatus;
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
public class ResourceResponseDto {
    
    private String id;
    private String resourceCode;
    private ResourceCategory category;
    private String type;
    private ResourceStatus status;
    private String resourceName;
    private String description;
    private String campusName;
    private String building;
    private String roomNumber;
    private Integer capacity;
    private String storageLocation;
    private String customType;
    private List<String> amenities;
    private String availableFrom;
    private String availableTo;
    private List<AvailabilityWindowDto> availabilityWindows;
    private Boolean requiresAttendanceCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String serialNumber;
    private String location;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilityWindowDto {
        private Integer dayOfWeek;
        private String startTime;
        private String endTime;
        private Boolean isAvailable;
    }
}
