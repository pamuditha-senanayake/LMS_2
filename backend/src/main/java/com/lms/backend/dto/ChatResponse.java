package com.lms.backend.dto;

import com.lms.backend.model.Resource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private String response;
    private List<Resource> resources;
    private String date;
    private String startTime;
    private String endTime;
    private String error;
}
