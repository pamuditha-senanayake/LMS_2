package com.lms.backend.controller;

import com.lms.backend.enums.ResourceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateResourceStatusDto {
    
    @NotNull(message = "Status is required")
    private ResourceStatus status;
}
