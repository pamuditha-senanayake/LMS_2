package com.lms.backend.config;

import com.lms.backend.model.Booking;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Configuration
@RequiredArgsConstructor
public class MongoIndexConfig {

    private final MongoTemplate mongoTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void initIndexes() {
        try {
            mongoTemplate.indexOps(Booking.class)
                .ensureIndex(new Index().on("requestedBy.userId", Sort.Direction.ASC).named("idx_requestedBy_userId"));
            mongoTemplate.indexOps(Booking.class)
                .ensureIndex(new Index().on("resourceId", Sort.Direction.ASC).named("idx_resourceId"));
            mongoTemplate.indexOps(Booking.class)
                .ensureIndex(new Index().on("status", Sort.Direction.ASC).named("idx_status"));
            mongoTemplate.indexOps(Booking.class)
                .ensureIndex(new Index().on("createdAt", Sort.Direction.DESC).named("idx_createdAt"));
            mongoTemplate.indexOps(Booking.class)
                .ensureIndex(new Index().on("resourceId", Sort.Direction.ASC)
                    .on("status", Sort.Direction.ASC)
                    .on("startTime", Sort.Direction.ASC).named("idx_resource_status_time"));
            mongoTemplate.indexOps(Booking.class)
                .ensureIndex(new Index().on("requestedBy.userId", Sort.Direction.ASC)
                    .on("status", Sort.Direction.ASC).named("idx_user_status"));
            
            log.info("MongoDB indexes created successfully for bookings collection");
        } catch (Exception e) {
            log.error("Failed to create MongoDB indexes: {}", e.getMessage());
        }
    }
}
