package com.lms.backend.repository;

import com.lms.backend.model.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String>, BookingRepositoryCustom {
    List<Booking> findByRequestedByUserId(String userId);
    List<Booking> findByResourceId(String resourceId);
    Page<Booking> findByRequestedByUserId(String userId, Pageable pageable);
    Page<Booking> findByResourceId(String resourceId, Pageable pageable);
    Page<Booking> findByStatus(String status, Pageable pageable);
    Page<Booking> findByResourceIdAndStatus(String resourceId, String status, Pageable pageable);
    
    @Query("{ 'resourceId': ?0, 'status': { $in: ['PENDING', 'APPROVED'] }, " +
           "'$or': [ { 'startTime': { '$lt': ?2 }, 'endTime': { '$gt': ?1 } } ] }")
    List<Booking> findConflictingBookings(String resourceId, LocalDateTime startTime, LocalDateTime endTime);
    
    @Query("{ 'resourceId': ?0, 'status': { $in: ['PENDING', 'APPROVED'] }, " +
           "'_id': { '$ne': ?3 }, " +
           "'$or': [ { 'startTime': { '$lt': ?2 }, 'endTime': { '$gt': ?1 } } ] }")
    List<Booking> findConflictingBookingsExcluding(String resourceId, LocalDateTime startTime, 
                                                    LocalDateTime endTime, String excludeBookingId);
    
    @Query("{ 'resourceId': ?0, 'status': { $in: ['PENDING', 'APPROVED'] } }")
    List<Booking> findActiveBookingsByResourceId(String resourceId);
    
    List<Booking> findByResourceIdAndStatusInAndStartTimeBetween(
            String resourceId, List<String> statuses, LocalDateTime start, LocalDateTime end);
    
    Page<Booking> findByRequestedByUserIdAndStatus(String userId, String status, Pageable pageable);
}
