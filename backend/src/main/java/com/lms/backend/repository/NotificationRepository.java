package com.lms.backend.repository;

import com.lms.backend.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByRecipientUserId(String recipientUserId);
    List<Notification> findByRecipientUserIdAndIsReadFalse(String recipientUserId);
}
