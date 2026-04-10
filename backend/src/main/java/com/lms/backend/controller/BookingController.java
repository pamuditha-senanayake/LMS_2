package com.lms.backend.controller;

import com.lms.backend.dto.*;
import com.lms.backend.model.Booking;
import com.lms.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<PaginatedResponseDto<BookingResponseDto>> getBookings(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        
        BookingFilterDto filter = BookingFilterDto.builder()
                .userId(userId)
                .resourceId(resourceId)
                .status(status)
                .type(type)
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();
        
        return ResponseEntity.ok(bookingService.getBookingsPaginated(filter));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponseDto> getBookingById(@PathVariable String bookingId) {
        return ResponseEntity.ok(bookingService.getBookingById(bookingId));
    }

    @GetMapping("/public/{bookingId}")
    public ResponseEntity<BookingResponseDto> getPublicBookingById(@PathVariable String bookingId) {
        return ResponseEntity.ok(bookingService.getBookingById(bookingId));
    }

    @GetMapping("/stats")
    public ResponseEntity<BookingStatsDto> getBookingStats() {
        return ResponseEntity.ok(bookingService.getBookingStats());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getUserBookings(@PathVariable String userId) {
        return ResponseEntity.ok(bookingService.getUserBookings(userId));
    }

    @GetMapping("/resource/{resourceId}")
    public ResponseEntity<List<Booking>> getBookingsByResource(@PathVariable String resourceId) {
        return ResponseEntity.ok(bookingService.getBookingsByResourceId(resourceId));
    }

    @GetMapping("/{bookingId}/history")
    public ResponseEntity<List<BookingResponseDto.BookingHistoryDto>> getBookingHistory(
            @PathVariable String bookingId) {
        return ResponseEntity.ok(bookingService.getBookingHistory(bookingId));
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody BookingRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request));
    }

    @PutMapping("/{bookingId}")
    public ResponseEntity<Booking> updateBooking(
            @PathVariable String bookingId,
            @Valid @RequestBody BookingRequestDto request) {
        return ResponseEntity.ok(bookingService.updateBooking(bookingId, request));
    }

    @PatchMapping("/{bookingId}/status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Booking> updateStatus(
            @PathVariable String bookingId,
            @RequestParam String status,
            @RequestParam String adminId,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(bookingService.updateBookingStatus(bookingId, status, adminId, reason));
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<Booking> cancelBooking(
            @PathVariable String bookingId,
            @RequestParam String userId) {
        return ResponseEntity.ok(bookingService.cancelBooking(bookingId, userId));
    }

    @DeleteMapping("/{bookingId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteBooking(@PathVariable String bookingId) {
        bookingService.deleteBooking(bookingId);
        return ResponseEntity.noContent().build();
    }
}
