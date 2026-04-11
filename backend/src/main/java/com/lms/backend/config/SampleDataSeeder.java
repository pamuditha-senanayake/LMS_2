package com.lms.backend.config;

import com.lms.backend.enums.ResourceCategory;
import com.lms.backend.enums.ResourceStatus;
import com.lms.backend.model.Resource;
import com.lms.backend.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SampleDataSeeder implements CommandLineRunner {

    private final ResourceRepository resourceRepository;

    @Override
    public void run(String... args) {
        if (resourceRepository.count() == 0) {
            log.info("Seeding sample resources for AI Chatbot testing...");
            
            List<Resource> resources = Arrays.asList(
                Resource.builder()
                        .resourceName("Lecture Hall A1")
                        .resourceType("Lecture Hall")
                        .category(ResourceCategory.FACILITY)
                        .status(ResourceStatus.ACTIVE)
                        .campusName("Main Campus")
                        .building("Administrative Block")
                        .roomNumber("A101")
                        .location("Main Campus - Admin Block")
                        .capacity(100)
                        .description("Large lecture hall with projector and sound system.")
                        .build(),
                Resource.builder()
                        .resourceName("IT Lab 01")
                        .resourceType("Lab")
                        .category(ResourceCategory.FACILITY)
                        .status(ResourceStatus.ACTIVE)
                        .campusName("IT Campus")
                        .building("Tech Wing")
                        .roomNumber("L202")
                        .location("IT Campus - Tech Wing")
                        .capacity(30)
                        .description("Computer lab with 30 high-spec workstations.")
                        .build(),
                Resource.builder()
                        .resourceName("Meeting Room 01")
                        .resourceType("Meeting Room")
                        .category(ResourceCategory.FACILITY)
                        .status(ResourceStatus.ACTIVE)
                        .campusName("Main Campus")
                        .building("Library Building")
                        .roomNumber("M01")
                        .location("Main Campus - Library")
                        .capacity(12)
                        .description("Small meeting room for team discussions.")
                        .build(),
                Resource.builder()
                        .resourceName("Conference Hall")
                        .resourceType("Hall")
                        .category(ResourceCategory.FACILITY)
                        .status(ResourceStatus.ACTIVE)
                        .campusName("West Campus")
                        .building("Auditorium")
                        .roomNumber("CH-01")
                        .location("West Campus - Auditorium")
                        .capacity(200)
                        .description("Massive conference hall for graduation and events.")
                        .build(),
                Resource.builder()
                        .resourceName("Mobile Projector P1")
                        .resourceType("Projector")
                        .category(ResourceCategory.UTILITY)
                        .status(ResourceStatus.ACTIVE)
                        .location("Main Storage")
                        .capacity(1)
                        .description("Portable HD projector.")
                        .build()
            );

            resourceRepository.saveAll(resources);
            log.info("Successfully seeded {} resources.", resources.size());
        } else {
            log.info("Database already contains resources, skipping seeding.");
        }
    }
}
