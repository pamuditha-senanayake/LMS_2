package com.lms.backend.repository;

import com.lms.backend.model.OAuthAccount;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OAuthAccountRepository extends MongoRepository<OAuthAccount, String> {
    Optional<OAuthAccount> findByProviderAndProviderUserId(String provider, String providerUserId);
    Optional<OAuthAccount> findByUserId(String userId);
}
