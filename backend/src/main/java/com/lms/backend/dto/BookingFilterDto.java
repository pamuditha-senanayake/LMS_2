package com.lms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingFilterDto {
    private String userId;
    private String resourceId;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String type;
    private Integer page;
    private Integer size;
    private String sortBy;
    private String sortDirection;
}
