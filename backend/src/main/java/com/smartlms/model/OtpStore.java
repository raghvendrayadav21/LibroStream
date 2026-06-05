package com.smartlms.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * OtpStore Document - MongoDB 'otp_store' collection
 * 
 * Registration ke waqt 6-digit OTP generate hota hai aur yahan temporarily store hota hai.
 * OTP sirf 10 minutes ke liye valid hota hai.
 * Verify hone ke baad yahan se delete ho jaata hai.
 * 
 * Email ko _id banaya hai taki ek email ke liye ek hi OTP rahe
 * (naya OTP generate karne par purana automatically replace ho jaata hai)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "otp_store")
public class OtpStore {

    /** Email ID hi primary key hai */
    @Id
    private String email;

    /** 6-digit OTP, e.g., "482910" */
    private String otp;

    /** OTP kab expire hoga (current time + 10 minutes) */
    private LocalDateTime expiresAt;
}
