package com.smartlms.listener;

import com.smartlms.model.College;
import com.smartlms.repository.BookRepository;
import com.smartlms.repository.TransactionRepository;
import com.smartlms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.BeforeDeleteEvent;
import org.springframework.stereotype.Component;
import org.bson.Document;

@Slf4j
@Component
@RequiredArgsConstructor
public class CollegeCascadeDeleteListener extends AbstractMongoEventListener<College> {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final TransactionRepository transactionRepository;

    @Override
    public void onBeforeDelete(BeforeDeleteEvent<College> event) {
        Document source = event.getSource();
        if (source != null) {
            String collegeId = source.get("_id").toString();
            log.info("Cascading delete for College ID: {}", collegeId);
            
            try {
                transactionRepository.deleteByCollegeId(collegeId);
                log.info("Deleted transactions for College ID: {}", collegeId);
            } catch (Exception e) {
                log.error("Failed to cascade delete transactions for College ID: {}", collegeId, e);
            }

            try {
                bookRepository.deleteByCollegeId(collegeId);
                log.info("Deleted books for College ID: {}", collegeId);
            } catch (Exception e) {
                log.error("Failed to cascade delete books for College ID: {}", collegeId, e);
            }

            try {
                userRepository.deleteByCollegeId(collegeId);
                log.info("Deleted users for College ID: {}", collegeId);
            } catch (Exception e) {
                log.error("Failed to cascade delete users for College ID: {}", collegeId, e);
            }
        }
    }
}
