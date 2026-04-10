package com.lms.backend.model;

import com.lms.backend.enums.ResourceCategory;
import com.lms.backend.enums.ResourceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "resources")
public class Resource {
    
    @Id
    private String id;
    
    private String resourceCode;
    
    @Builder.Default
    private ResourceCategory category = ResourceCategory.FACILITY;
    
    private String type;
    
    @Builder.Default
    private ResourceStatus status = ResourceStatus.ACTIVE;
    
    private String resourceName;

    @NotBlank(message = "Resource type is required")
    private String resourceType; 

    private String description;
    
    private String campusName;
    
    private String building;
    
    private String roomNumber;
    
    private Integer capacity;
    
    private String storageLocation;
    
    private String customType;
    
    private List<String> amenities;
    
    private String serialNumber;
    
    private String location;
    
    private String availableFrom;
    
    private String availableTo;
    
    private List<AvailabilityWindow> availabilityWindows;
    
    private Boolean requiresAttendanceCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilityWindow {
        private Integer dayOfWeek;
        private String startTime;
        private String endTime;
        private Boolean isAvailable;
    }
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
