package com.lms.backend.service;

import com.lms.backend.model.TicketRating;
import com.lms.backend.repository.TicketRatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final TicketRatingRepository ratingRepository;

    public TicketRating submitRating(String ticketId, String userId, int rating, String feedback) {
        Optional<TicketRating> existing = ratingRepository.findByTicketIdAndUserId(ticketId, userId);
        
        if (existing.isPresent()) {
            TicketRating existingRating = existing.get();
            existingRating.setRating(rating);
            existingRating.setFeedback(feedback);
            return ratingRepository.save(existingRating);
        }
        
        TicketRating newRating = TicketRating.builder()
                .ticketId(ticketId)
                .userId(userId)
                .rating(rating)
                .feedback(feedback)
                .createdAt(LocalDateTime.now())
                .build();
        
        return ratingRepository.save(newRating);
    }

    public Optional<TicketRating> getRating(String ticketId, String userId) {
        return ratingRepository.findByTicketIdAndUserId(ticketId, userId);
    }

    public Optional<TicketRating> getRatingByTicketId(String ticketId) {
        List<TicketRating> ratings = ratingRepository.findByTicketId(ticketId);
        return ratings.isEmpty() ? Optional.empty() : Optional.of(ratings.get(0));
    }

    public List<TicketRating> getAllRatings() {
        return ratingRepository.findAll();
    }

    public boolean hasRated(String ticketId, String userId) {
        return ratingRepository.existsByTicketIdAndUserId(ticketId, userId);
    }

    public Map<String, Object> getRatingStatistics() {
        List<TicketRating> allRatings = ratingRepository.findAll();
        
        Map<String, Object> stats = new HashMap<>();
        
        if (allRatings.isEmpty()) {
            stats.put("totalRatings", 0);
            stats.put("averageRating", 0.0);
            stats.put("ratingDistribution", Map.of("1", 0, "2", 0, "3", 0, "4", 0, "5", 0));
            return stats;
        }
        
        double averageRating = allRatings.stream()
                .mapToInt(TicketRating::getRating)
                .average()
                .orElse(0.0);
        
        Map<String, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            final int ratingValue = i;
            long count = allRatings.stream()
                    .filter(r -> r.getRating() == ratingValue)
                    .count();
            distribution.put(String.valueOf(i), count);
        }
        
        stats.put("totalRatings", allRatings.size());
        stats.put("averageRating", Math.round(averageRating * 10) / 10.0);
        stats.put("ratingDistribution", distribution);
        
        return stats;
    }
}
