package com.lms.backend.repository;

import com.lms.backend.model.IncidentTicket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentTicketRepository extends MongoRepository<IncidentTicket, String> {
    List<IncidentTicket> findByReportedById(String reportedById);
    List<IncidentTicket> findByResourceId(String resourceId);
    List<IncidentTicket> findByAssignedToId(String assignedToId);
}
