package com.lms.backend.repository;

import com.lms.backend.model.ResourceType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceTypeRepository extends MongoRepository<ResourceType, String> {
}
