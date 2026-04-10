package com.lms.backend.repository;

import com.lms.backend.model.TicketRating;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRatingRepository extends MongoRepository<TicketRating, String> {
    Optional<TicketRating> findByTicketIdAndUserId(String ticketId, String userId);
    List<TicketRating> findByTicketId(String ticketId);
    List<TicketRating> findAll();
    boolean existsByTicketIdAndUserId(String ticketId, String userId);
}
