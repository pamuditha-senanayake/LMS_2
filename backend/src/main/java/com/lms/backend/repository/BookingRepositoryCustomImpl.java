package com.lms.backend.repository;

import com.lms.backend.dto.BookingStatsDto;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.ConditionalOperators;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class BookingRepositoryCustomImpl implements BookingRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public BookingStatsDto getBookingStats() {
        Aggregation aggregation = Aggregation.newAggregation(
            Aggregation.group()
                .count().as("total")
                .sum(ConditionalOperators.when(Criteria.where("status").is("PENDING")).then(1).otherwise(0)).as("pending")
                .sum(ConditionalOperators.when(Criteria.where("status").is("APPROVED")).then(1).otherwise(0)).as("approved")
                .sum(ConditionalOperators.when(Criteria.where("status").is("REJECTED")).then(1).otherwise(0)).as("rejected")
                .sum(ConditionalOperators.when(Criteria.where("status").is("CANCELLED")).then(1).otherwise(0)).as("cancelled")
        );

        Document result = mongoTemplate.aggregate(aggregation, "bookings", Document.class).getUniqueMappedResult();

        if (result == null) {
            return BookingStatsDto.builder()
                    .total(0)
                    .pending(0)
                    .approved(0)
                    .rejected(0)
                    .cancelled(0)
                    .build();
        }

        return BookingStatsDto.builder()
                .total(getLongValue(result, "total"))
                .pending(getLongValue(result, "pending"))
                .approved(getLongValue(result, "approved"))
                .rejected(getLongValue(result, "rejected"))
                .cancelled(getLongValue(result, "cancelled"))
                .build();
    }

    private long getLongValue(Document doc, String field) {
        Object value = doc.get(field);
        if (value instanceof Long) return (Long) value;
        if (value instanceof Integer) return ((Integer) value).longValue();
        return 0L;
    }
}
