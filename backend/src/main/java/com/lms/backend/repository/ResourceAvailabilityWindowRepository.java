package com.lms.backend.repository;

import com.lms.backend.model.ResourceAvailabilityWindow;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceAvailabilityWindowRepository extends MongoRepository<ResourceAvailabilityWindow, String> {
    List<ResourceAvailabilityWindow> findByResourceId(String resourceId);
}
