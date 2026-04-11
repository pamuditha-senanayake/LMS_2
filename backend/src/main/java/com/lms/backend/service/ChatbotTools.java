package com.lms.backend.service;

import com.lms.backend.model.Resource;
import com.lms.backend.repository.ResourceRepository;
import com.lms.backend.repository.BookingRepository;
import dev.langchain4j.agent.tool.Tool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ChatbotTools {

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;

    @Tool("Search for facilities or utilities available in the system. Filter by name, type, location, and minimum capacity. Leave fields null if not specified.")
    public List<Resource> searchResources(String name, String type, String location, Integer minCapacity) {
        String nameLower = name != null ? name.toLowerCase() : null;
        String typeNorm = type != null ? type.toLowerCase().replace("_", " ").trim() : null;
        String locationLower = location != null ? location.toLowerCase() : null;

        return resourceRepository.findAll().stream()
                .filter(r -> nameLower == null || 
                        (r.getResourceName() != null && r.getResourceName().toLowerCase().contains(nameLower)) ||
                        (r.getResourceCode() != null && r.getResourceCode().toLowerCase().contains(nameLower)))
                .filter(r -> typeNorm == null || 
                        (r.getResourceType() != null && r.getResourceType().toLowerCase().replace("_", " ").contains(typeNorm)) ||
                        (r.getType() != null && r.getType().toLowerCase().replace("_", " ").contains(typeNorm)) ||
                        (r.getCategory() != null && r.getCategory().name().toLowerCase().replace("_", " ").contains(typeNorm)))
                .filter(r -> locationLower == null || 
                        (r.getLocation() != null && (r.getLocation().toLowerCase().contains(locationLower) || locationLower.contains(r.getLocation().toLowerCase()))) ||
                        (r.getCampusName() != null && (r.getCampusName().toLowerCase().contains(locationLower) || locationLower.contains(r.getCampusName().toLowerCase()))) ||
                        (r.getBuilding() != null && (r.getBuilding().toLowerCase().contains(locationLower) || locationLower.contains(r.getBuilding().toLowerCase()))) ||
                        (r.getRoomNumber() != null && (r.getRoomNumber().toLowerCase().contains(locationLower) || locationLower.contains(r.getRoomNumber().toLowerCase()))))
                .filter(r -> minCapacity == null || (r.getCapacity() != null && r.getCapacity() >= minCapacity))
                .collect(Collectors.toList());
    }

    @Tool("Check if a specific resource is available for a given date and time range. Date format: YYYY-MM-DD, Time format: HH:mm.")
    public String checkAvailability(String resourceId, String date, String startTime, String endTime) {
        try {
            LocalDateTime start = LocalDateTime.parse(date + "T" + startTime + ":00");
            LocalDateTime end = LocalDateTime.parse(date + "T" + endTime + ":00");
            var conflicting = bookingRepository.findConflictingBookings(resourceId, start, end);
            if (conflicting.isEmpty()) {
                return "The resource is AVAILABLE for this time slot.";
            } else {
                return "The resource is NOT AVAILABLE. It has conflicting bookings.";
            }
        } catch (Exception e) {
            return "Error checking availability: " + e.getMessage() + ". Please ensure date is YYYY-MM-DD and time is HH:mm.";
        }
    }

    @Tool("List all unique campus locations and building names.")
    public List<String> listLocations() {
        return resourceRepository.findAll().stream()
                .map(r -> {
                    String loc = "";
                    if (r.getCampusName() != null) loc += r.getCampusName();
                    if (r.getBuilding() != null) loc += " - " + r.getBuilding();
                    return loc;
                })
                .filter(l -> !l.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }
}
