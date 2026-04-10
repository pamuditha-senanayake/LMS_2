package com.lms.backend.dto;

import com.lms.backend.enums.ResourceCategory;
import com.lms.backend.enums.ResourceStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceRequestDto {
    
    @NotBlank(message = "Resource name is required")
    private String resourceName;
    
    @NotNull(message = "Category is required")
    private ResourceCategory category;
    
    @NotBlank(message = "Type is required")
    private String type;
    
    private String description;
    
    private String campusName;
    
    private String building;
    
    private String roomNumber;
    
    @Min(value = 0, message = "Capacity cannot be negative")
    private Integer capacity;
    
    private String storageLocation;
    
    private String customType;
    
    private List<String> amenities;
    
    private ResourceStatus status;
    
    private String availableFrom;
    
    private String availableTo;
    
    private List<AvailabilityWindowDto> availabilityWindows;
    
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
