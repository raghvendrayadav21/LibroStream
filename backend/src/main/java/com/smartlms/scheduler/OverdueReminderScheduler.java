package com.smartlms.scheduler;

import com.smartlms.model.BookTransaction;
import com.smartlms.model.College;
import com.smartlms.model.User;
import com.smartlms.repository.CollegeRepository;
import com.smartlms.repository.TransactionRepository;
import com.smartlms.repository.UserRepository;
import com.smartlms.service.EmailService;
import com.smartlms.service.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Overdue Reminder Scheduler
 *
 * Yeh scheduler Spring Boot startup par automatically register ho jaata hai.
 * @EnableScheduling SmartLmsApplication.java me already add hai.
 *
 * 2 CRON JOBS:
 *
 * JOB 1: markOverdueAndSendReminders() — Har subah 8:00 AM
 *   - ISSUED transactions jinka dueDate nikal gaya → OVERDUE mark karo
 *   - Un students ko personalized email bhejo:
 *     "Dear Arjun, 'Introduction to Java' is 3 days overdue. Fine: ₹15"
 *
 * JOB 2: sendDueTodayReminders() — Har subah 9:00 AM
 *   - Jinki book aaj due hai unhe advance reminder bhejo
 *   - "Your book is due today! Please return it."
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OverdueReminderScheduler {

    private final TransactionRepository transactionRepository;
    private final CollegeRepository collegeRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final TransactionService transactionService;

    // =====================================================================
    //  JOB 1: Har subah 8:00 AM — OVERDUE mark + reminder emails
    //  Cron: second minute hour day month weekday
    //        0      0      8   *   *     *
    // =====================================================================
    @Scheduled(cron = "0 0 8 * * ?")
    public void markOverdueAndSendReminders() {
        log.info("=== SCHEDULER START: Daily Overdue Check [{}] ===", LocalDate.now());

        LocalDate today = LocalDate.now();

        // Step 1: ISSUED transactions dhundho jinka dueDate aaj se pehle nikal gaya
        List<BookTransaction> overdueList =
                transactionRepository.findByStatusAndDueDateBefore("ISSUED", today);

        if (overdueList.isEmpty()) {
            log.info("No new overdue transactions found today.");
            return;
        }

        log.info("Found {} overdue transactions. Marking and sending emails...", overdueList.size());

        int emailsSent = 0;
        int markedOverdue = 0;

        for (BookTransaction transaction : overdueList) {
            try {
                // Step 2: Status → OVERDUE
                transaction.setStatus("OVERDUE");
                transactionRepository.save(transaction);
                markedOverdue++;

                // Step 3: College ke penalty settings fetch karo
                College college = collegeRepository.findById(transaction.getCollegeId())
                        .orElse(null);
                if (college == null) continue;

                // Step 4: Live penalty calculate karo
                long daysLate = ChronoUnit.DAYS.between(transaction.getDueDate(), today);
                double penalty = daysLate * college.getPenaltyPerDay();

                // Step 5: Student ka email dhundho
                User student = userRepository.findById(transaction.getStudentId()).orElse(null);
                if (student == null || !student.isActive()) continue;

                // Step 6: Personalized email bhejo
                emailService.sendOverdueReminderEmail(
                        student.getEmail(),
                        student.getName(),
                        transaction.getBookTitle(),
                        daysLate,
                        penalty,
                        college.getPenaltyPerDay()
                );
                emailsSent++;

            } catch (Exception e) {
                log.error("Error processing transaction {}: {}", transaction.getId(), e.getMessage());
            }
        }

        log.info("=== SCHEDULER DONE: Marked={}, Emails Sent={} ===", markedOverdue, emailsSent);
    }

    // =====================================================================
    //  JOB 2: Har subah 9:00 AM — "Due Today" reminder
    // =====================================================================
    @Scheduled(cron = "0 0 9 * * ?")
    public void sendDueTodayReminders() {
        log.info("=== SCHEDULER: Due Today Reminder Check [{}] ===", LocalDate.now());

        LocalDate today = LocalDate.now();

        // Aaj due hone wali ISSUED transactions
        List<BookTransaction> dueTodayList =
                transactionRepository.findByStatusAndDueDateBefore("ISSUED", today.plusDays(1));

        dueTodayList = dueTodayList.stream()
                .filter(t -> t.getDueDate().equals(today))
                .toList();

        if (dueTodayList.isEmpty()) {
            log.info("No books due today.");
            return;
        }

        log.info("Sending 'due today' reminders for {} books...", dueTodayList.size());

        for (BookTransaction transaction : dueTodayList) {
            try {
                User student = userRepository.findById(transaction.getStudentId()).orElse(null);
                if (student == null) continue;

                College college = collegeRepository.findById(transaction.getCollegeId()).orElse(null);
                double penaltyPerDay = (college != null) ? college.getPenaltyPerDay() : 5.0;

                // Due today reminder bhejo (0 days late, 0 penalty abhi)
                emailService.sendOverdueReminderEmail(
                        student.getEmail(),
                        student.getName(),
                        transaction.getBookTitle() + " (Due Today!)",
                        0L,
                        0.0,
                        penaltyPerDay
                );
            } catch (Exception e) {
                log.error("Error sending due-today reminder: {}", e.getMessage());
            }
        }

        log.info("Due today reminders sent.");
    }

    // =====================================================================
    //  MANUAL TRIGGER (Testing ke liye — POST /api/admin/scheduler/run)
    //  Yeh method AdminController se call kar sakte hain development me
    // =====================================================================
    public void runManually() {
        log.info("Manual scheduler trigger initiated...");
        markOverdueAndSendReminders();
    }
}
