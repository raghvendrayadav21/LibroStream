package com.smartlms.repository;

import com.smartlms.model.OtpStore;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OtpStoreRepository extends MongoRepository<OtpStore, String> {
    // Email hi _id hai, isliye findById(email) se OTP milega
    // Koi alag method banana zaruri nahi
}
