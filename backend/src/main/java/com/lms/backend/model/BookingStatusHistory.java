package com.lms.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "booking_status_history")
public class BookingStatusHistory {
    @Id
    private String id;
    
    private String bookingId;
    private String changedById;
    
    private String oldStatus;
    private String newStatus;
    private String note;
    
    @CreatedDate
    private LocalDateTime changedAt;
}
