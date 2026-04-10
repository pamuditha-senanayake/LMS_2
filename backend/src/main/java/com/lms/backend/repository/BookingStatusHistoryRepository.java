package com.lms.backend.repository;

import com.lms.backend.model.BookingStatusHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingStatusHistoryRepository extends MongoRepository<BookingStatusHistory, String> {
    List<BookingStatusHistory> findByBookingId(String bookingId);
}
