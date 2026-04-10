package com.lms.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ticket_ratings")
@CompoundIndex(name = "ticket_user_idx", def = "{'ticketId': 1, 'userId': 1}", unique = true)
public class TicketRating {
    @Id
    private String id;

    @NotNull(message = "Ticket ID is required")
    private String ticketId;

    @NotNull(message = "User ID is required")
    private String userId;

    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must not exceed 5")
    private int rating;

    private String feedback;

    @CreatedDate
    private LocalDateTime createdAt;
}
