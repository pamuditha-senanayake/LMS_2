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
@Document(collection = "ticket_attachments")
public class TicketAttachment {
    @Id
    private String id;
    
    private String ticketId;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
    
    private String uploadedById;
    
    @CreatedDate
    private LocalDateTime uploadedAt;
}
