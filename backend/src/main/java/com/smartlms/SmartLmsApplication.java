package com.smartlms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@SpringBootApplication
@EnableScheduling   // Cron job (daily overdue email reminders) ke liye
@EnableAsync        // Background async tasks (jaise email sending) ke liye
public class SmartLmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartLmsApplication.class, args);
        System.out.println("==============================================");
        System.out.println("  SmartLMS Backend Started Successfully!");
        System.out.println("  API Base URL: http://localhost:8080/api");
        System.out.println("  MongoDB: smartlms database");
        System.out.println("==============================================");
    }

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("AsyncThread-");
        executor.initialize();
        return executor;
    }
}
