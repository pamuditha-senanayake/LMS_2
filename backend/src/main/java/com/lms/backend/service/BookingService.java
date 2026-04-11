package com.lms.backend.service;

import com.lms.backend.dto.*;
import com.lms.backend.enums.ResourceStatus;
import com.lms.backend.model.*;
import com.lms.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingStatusHistoryRepository historyRepository;
    private final ResourceRepository resourceRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getUserBookings(String userId) {
        return bookingRepository.findByRequestedByUserId(userId);
    }

    public List<Booking> getBookingsByResourceId(String resourceId) {
        return bookingRepository.findByResourceId(resourceId);
    }

    public BookingResponseDto getBookingById(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        return convertToResponseDto(booking);
    }

    public BookingStatsDto getBookingStats() {
        return bookingRepository.getBookingStats();
    }

    public PaginatedResponseDto<BookingResponseDto> getBookingsPaginated(BookingFilterDto filter) {
        int page = filter.getPage() != null ? filter.getPage() : 0;
        int size = filter.getSize() != null ? filter.getSize() : 10;
        String sortBy = filter.getSortBy() != null ? filter.getSortBy() : "createdAt";
        String sortDir = filter.getSortDirection() != null ? filter.getSortDirection() : "DESC";
        
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<Booking> bookingPage;
        
        if (filter.getUserId() != null && !filter.getUserId().isEmpty()) {
            if (filter.getStatus() != null && !filter.getStatus().isEmpty()) {
                bookingPage = bookingRepository.findByRequestedByUserIdAndStatus(filter.getUserId(), filter.getStatus(), pageable);
            } else {
                bookingPage = bookingRepository.findByRequestedByUserId(filter.getUserId(), pageable);
            }
        } else if (filter.getResourceId() != null && !filter.getResourceId().isEmpty()) {
            if (filter.getStatus() != null && !filter.getStatus().isEmpty()) {
                bookingPage = bookingRepository.findByResourceIdAndStatus(filter.getResourceId(), filter.getStatus(), pageable);
            } else {
                bookingPage = bookingRepository.findByResourceId(filter.getResourceId(), pageable);
            }
        } else if (filter.getStatus() != null && !filter.getStatus().isEmpty()) {
            bookingPage = bookingRepository.findByStatus(filter.getStatus(), pageable);
        } else {
            bookingPage = bookingRepository.findAll(pageable);
        }
        
        List<BookingResponseDto> content = bookingPage.getContent().stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
        
        return PaginatedResponseDto.<BookingResponseDto>builder()
                .content(content)
                .page(bookingPage.getNumber())
                .size(bookingPage.getSize())
                .totalElements(bookingPage.getTotalElements())
                .totalPages(bookingPage.getTotalPages())
                .first(bookingPage.isFirst())
                .last(bookingPage.isLast())
                .build();
    }

    public AvailabilityResponseDto checkAvailability(String resourceId, LocalDate date) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
        
        if (resource.getStatus() == ResourceStatus.OUT_OF_SERVICE) {
            return AvailabilityResponseDto.builder()
                    .resourceId(resourceId)
                    .resourceName(resource.getResourceName())
                    .date(date)
                    .available(false)
                    .conflicts(Collections.emptyList())
                    .build();
        }
        
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);
        
        List<Booking> activeBookings = bookingRepository.findActiveBookingsByResourceId(resourceId);
        List<Booking> dayBookings = activeBookings.stream()
                .filter(b -> !b.getStartTime().isAfter(endOfDay) && !b.getEndTime().isBefore(startOfDay))
                .collect(Collectors.toList());
        
        List<AvailabilityResponseDto.ConflictInfo> conflicts = dayBookings.stream()
                .map(b -> AvailabilityResponseDto.ConflictInfo.builder()
                        .bookingId(b.getId())
                        .purpose(b.getPurpose())
                        .startTime(b.getStartTime().toLocalTime())
                        .endTime(b.getEndTime().toLocalTime())
                        .status(b.getStatus())
                        .build())
                .collect(Collectors.toList());
        
        List<AvailabilityResponseDto.AvailabilitySlot> slots = generateTimeSlots(date, dayBookings, resource);
        
        List<String> availabilityWindows = new ArrayList<>();
        if (resource.getAvailabilityWindows() != null) {
            availabilityWindows = resource.getAvailabilityWindows().stream()
                    .filter(w -> w.getIsAvailable() != null && w.getIsAvailable())
                    .map(w -> String.format("Day %d: %s - %s", w.getDayOfWeek(), w.getStartTime(), w.getEndTime()))
                    .collect(Collectors.toList());
        }
        
        return AvailabilityResponseDto.builder()
                .resourceId(resourceId)
                .resourceName(resource.getResourceName())
                .date(date)
                .available(conflicts.isEmpty())
                .availableSlots(slots)
                .conflicts(conflicts)
                .availabilityWindows(availabilityWindows)
                .build();
    }

    private List<AvailabilityResponseDto.AvailabilitySlot> generateTimeSlots(LocalDate date, 
                                                                             List<Booking> bookings,
                                                                             Resource resource) {
        List<AvailabilityResponseDto.AvailabilitySlot> slots = new ArrayList<>();
        
        LocalTime startHour = LocalTime.of(8, 0);
        LocalTime endHour = LocalTime.of(20, 0);
        
        LocalTime current = startHour;
        while (current.isBefore(endHour)) {
            final LocalTime slotStartTime = current;
            final LocalTime slotEndTime = current.plusHours(1);
            boolean isAvailable = bookings.stream()
                    .noneMatch(b -> {
                        LocalDateTime slotStart = date.atTime(slotStartTime);
                        LocalDateTime slotEnd = date.atTime(slotEndTime);
                        return slotStart.isBefore(b.getEndTime()) && slotEnd.isAfter(b.getStartTime());
                    });
            
            slots.add(AvailabilityResponseDto.AvailabilitySlot.builder()
                    .startTime(current)
                    .endTime(slotEndTime)
                    .available(isAvailable)
                    .build());
            
            current = slotEndTime;
        }
        
        return slots;
    }

    public List<BookingResponseDto.BookingHistoryDto> getBookingHistory(String bookingId) {
        if (!bookingRepository.existsById(bookingId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
        }
        
        List<BookingStatusHistory> historyList = historyRepository.findByBookingId(bookingId);
        
        return historyList.stream()
                .map(h -> {
                    String changedByName = getUserName(h.getChangedById());
                    return BookingResponseDto.BookingHistoryDto.builder()
                            .id(h.getId())
                            .oldStatus(h.getOldStatus())
                            .newStatus(h.getNewStatus())
                            .changedById(h.getChangedById())
                            .changedByName(changedByName)
                            .note(h.getNote())
                            .changedAt(h.getChangedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    public Booking createBooking(BookingRequestDto request) {
        validateBookingRequest(request);

        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));

        if (resource.getStatus() == ResourceStatus.OUT_OF_SERVICE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "RESOURCE_OUT_OF_SERVICE:This resource is currently out of service");
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                request.getResourceId(), request.getStartTime(), request.getEndTime());
        
        if (!conflicts.isEmpty()) {
            Booking conflictingBooking = conflicts.get(0);
            String conflictMessage = String.format("BOOKING_CONFLICT:%s is already booked from %s to %s. It will be free after %s.",
                    resource.getResourceName(),
                    conflictingBooking.getStartTime().toLocalTime().toString(),
                    conflictingBooking.getEndTime().toLocalTime().toString(),
                    conflictingBooking.getEndTime().toLocalTime().toString());
            throw new ResponseStatusException(HttpStatus.CONFLICT, conflictMessage);
        }

        Booking booking = Booking.builder()
                .resourceId(request.getResourceId().trim())
                .purpose(request.getPurpose().trim())
                .expectedAttendees(request.getExpectedAttendees())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .type(request.getType())
                .status("PENDING")
                .requestedBy(Booking.UserSummary.builder()
                        .userId(request.getRequestedByUserId())
                        .name(request.getRequestedByName())
                        .email(request.getRequestedByEmail())
                        .build())
                .build();
        
        booking.setCreatedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        
        return bookingRepository.save(booking);
    }

    public Booking updateBookingStatus(String bookingId, String newStatus, String adminId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        
        String oldStatus = booking.getStatus();

        if (!isValidStatusTransition(oldStatus, newStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid status transition from " + oldStatus + " to " + newStatus);
        }

        if ("APPROVED".equals(newStatus)) {
            List<Booking> conflicts = bookingRepository.findConflictingBookingsExcluding(
                    booking.getResourceId(), booking.getStartTime(), booking.getEndTime(), bookingId);
            
            if (!conflicts.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, 
                        "Cannot approve: Resource has conflicting bookings during this time range");
            }
            booking.setApprovedAt(LocalDateTime.now());
            booking.setRejectionReason(null);
        } else if ("REJECTED".equals(newStatus)) {
            booking.setRejectionReason(reason);
        } else if ("CANCELLED".equals(newStatus)) {
            booking.setCancelledAt(LocalDateTime.now());
        }

        booking.setStatus(newStatus);
        booking.setUpdatedAt(LocalDateTime.now());
        
        Booking updatedBooking = bookingRepository.save(booking);
        
        createStatusHistory(bookingId, adminId, oldStatus, newStatus, reason);
        
        createBookingNotification(updatedBooking, adminId, newStatus, reason);
        
        return updatedBooking;
    }

    public Booking cancelBooking(String bookingId, String userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        
        if (!"APPROVED".equals(booking.getStatus()) && !"PENDING".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Only APPROVED or PENDING bookings can be cancelled");
        }
        
        if (booking.getRequestedBy() != null && 
            !booking.getRequestedBy().getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "You can only cancel your own bookings");
        }
        
        String oldStatus = booking.getStatus();
        booking.setStatus("CANCELLED");
        booking.setCancelledAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        
        Booking cancelledBooking = bookingRepository.save(booking);
        
        createStatusHistory(bookingId, userId, oldStatus, "CANCELLED", "Cancelled by user");
        
        return cancelledBooking;
    }

    public Booking updateBooking(String bookingId, BookingRequestDto update) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        
        if (!"PENDING".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Can only update PENDING bookings");
        }

        booking.setPurpose(update.getPurpose());
        booking.setExpectedAttendees(update.getExpectedAttendees());
        booking.setStartTime(update.getStartTime());
        booking.setEndTime(update.getEndTime());

        validateBookingRequest(update);
        
        List<Booking> conflicts = bookingRepository.findConflictingBookingsExcluding(
                booking.getResourceId(), booking.getStartTime(), booking.getEndTime(), bookingId);
        
        if (!conflicts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                    "Resource is already booked during this time range");
        }

        booking.setPurpose(booking.getPurpose().trim());
        booking.setUpdatedAt(LocalDateTime.now());
        
        return bookingRepository.save(booking);
    }

    public void deleteBooking(String bookingId) {
        if (!bookingRepository.existsById(bookingId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
        }
        bookingRepository.deleteById(bookingId);
    }

    private void validateBookingRequest(BookingRequestDto request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking request must not be null");
        }
        if (request.getResourceId() == null || request.getResourceId().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource ID must not be empty");
        }
        if (request.getStartTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time must not be null");
        }
        if (request.getEndTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must not be null");
        }
        if (request.getPurpose() == null || request.getPurpose().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Purpose must not be empty");
        }
        if (request.getExpectedAttendees() == null || request.getExpectedAttendees() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expected attendees must be at least 1");
        }
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time must be before end time");
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime minAllowedTime = now.plusMinutes(15);
        if (request.getStartTime().isBefore(minAllowedTime)) {
            LocalDate requestDate = request.getStartTime().toLocalDate();
            LocalDate today = now.toLocalDate();
            if (requestDate.equals(today)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TIME_TOO_SOON:For today, please select a time at least 15 minutes in the future");
            } else if (requestDate.isBefore(today)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TIME_TOO_SOON:Cannot book for a past date");
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TIME_TOO_SOON:Start time must be in the future");
            }
        }
    }

    private boolean isValidStatusTransition(String currentStatus, String newStatus) {
        Map<String, List<String>> validTransitions = new HashMap<>();
        validTransitions.put("PENDING", Arrays.asList("APPROVED", "REJECTED", "CANCELLED"));
        validTransitions.put("APPROVED", Arrays.asList("CANCELLED"));
        validTransitions.put("REJECTED", Arrays.asList("PENDING"));
        
        List<String> allowed = validTransitions.getOrDefault(currentStatus, Collections.emptyList());
        return allowed.contains(newStatus);
    }

    private void createStatusHistory(String bookingId, String adminId, String oldStatus, 
                                     String newStatus, String reason) {
        BookingStatusHistory history = BookingStatusHistory.builder()
                .bookingId(bookingId)
                .changedById(adminId)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .note(reason)
                .build();
        historyRepository.save(history);
    }

    private void createBookingNotification(Booking booking, String adminId, 
                                             String newStatus, String reason) {
        String recipientUserId = booking.getRequestedBy() != null ? 
                booking.getRequestedBy().getUserId() : null;
        
        if (recipientUserId == null) return;
        
        String message = "Your booking for " + getResourceName(booking.getResourceId()) + 
                " has been " + newStatus;
        if (reason != null && !reason.isEmpty()) {
            message += ". Notes: " + reason;
        }
        
        Notification notification = Notification.builder()
                .recipientUserId(recipientUserId)
                .createdById(adminId)
                .notificationType("BOOKING_STATUS_UPDATE")
                .title("Booking " + newStatus)
                .message(message)
                .relatedEntityType("BOOKING")
                .relatedEntityId(booking.getId())
                .build();
        
        notificationService.createNotification(notification);
    }

    private String getResourceName(String resourceId) {
        return resourceRepository.findById(resourceId)
                .map(Resource::getResourceName)
                .orElse(resourceId);
    }

    private String getUserName(String userId) {
        if (userId == null) return "System";
        return userRepository.findById(userId)
                .map(User::getName)
                .orElse(userId);
    }

    private BookingResponseDto convertToResponseDto(Booking booking) {
        Resource resource = resourceRepository.findById(booking.getResourceId()).orElse(null);
        
        List<BookingStatusHistory> historyList = historyRepository.findByBookingId(booking.getId());
        List<BookingResponseDto.BookingHistoryDto> history = historyList.stream()
                .map(h -> BookingResponseDto.BookingHistoryDto.builder()
                        .id(h.getId())
                        .oldStatus(h.getOldStatus())
                        .newStatus(h.getNewStatus())
                        .changedById(h.getChangedById())
                        .changedByName(getUserName(h.getChangedById()))
                        .note(h.getNote())
                        .changedAt(h.getChangedAt())
                        .build())
                .collect(Collectors.toList());
        
        return BookingResponseDto.builder()
                .id(booking.getId())
                .resourceId(booking.getResourceId())
                .resourceName(resource != null ? resource.getResourceName() : null)
                .resourceType(resource != null ? resource.getType() : null)
                .resourceLocation(resource != null ? 
                        formatLocation(resource) : null)
                .resourceCapacity(resource != null ? resource.getCapacity() : null)
                .requestedBy(booking.getRequestedBy() != null ?
                        BookingResponseDto.UserSummaryDto.builder()
                                .userId(booking.getRequestedBy().getUserId())
                                .name(booking.getRequestedBy().getName())
                                .email(booking.getRequestedBy().getEmail())
                                .build() : null)
                .reviewedBy(booking.getReviewedBy() != null ?
                        BookingResponseDto.UserSummaryDto.builder()
                                .userId(booking.getReviewedBy().getUserId())
                                .name(booking.getReviewedBy().getName())
                                .email(booking.getReviewedBy().getEmail())
                                .build() : null)
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .type(booking.getType())
                .status(booking.getStatus())
                .rejectionReason(booking.getRejectionReason())
                .approvedAt(booking.getApprovedAt())
                .cancelledAt(booking.getCancelledAt())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .history(history)
                .build();
    }

    private String formatLocation(Resource resource) {
        StringBuilder sb = new StringBuilder();
        if (resource.getCampusName() != null) sb.append(resource.getCampusName());
        if (resource.getBuilding() != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(resource.getBuilding());
        }
        if (resource.getRoomNumber() != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append("Room ").append(resource.getRoomNumber());
        }
        return sb.toString();
    }
}
