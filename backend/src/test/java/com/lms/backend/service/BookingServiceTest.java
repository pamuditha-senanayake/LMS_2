package com.lms.backend.service;

import com.lms.backend.dto.AvailabilityResponseDto;
import com.lms.backend.dto.BookingRequestDto;
import com.lms.backend.dto.BookingResponseDto;
import com.lms.backend.enums.ResourceStatus;
import com.lms.backend.model.Booking;
import com.lms.backend.model.BookingStatusHistory;
import com.lms.backend.model.Resource;
import com.lms.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingStatusHistoryRepository historyRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BookingService bookingService;

    private Resource testResource;
    private Booking testBooking;
    private BookingRequestDto testRequest;

    @BeforeEach
    void setUp() {
        testResource = Resource.builder()
                .id("resource-1")
                .resourceName("Conference Room A")
                .type("MEETING_ROOM")
                .status(ResourceStatus.ACTIVE)
                .capacity(20)
                .campusName("Main Campus")
                .building("Building 1")
                .roomNumber("101")
                .build();

        testBooking = Booking.builder()
                .id("booking-1")
                .resourceId("resource-1")
                .purpose("Team Meeting")
                .expectedAttendees(10)
                .startTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0))
                .endTime(LocalDateTime.now().plusDays(1).withHour(11).withMinute(0))
                .type("FACILITY")
                .status("PENDING")
                .requestedBy(Booking.UserSummary.builder()
                        .userId("user-1")
                        .name("John Doe")
                        .email("john@example.com")
                        .build())
                .build();

        testRequest = BookingRequestDto.builder()
                .resourceId("resource-1")
                .purpose("Team Meeting")
                .expectedAttendees(10)
                .startTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0))
                .endTime(LocalDateTime.now().plusDays(1).withHour(11).withMinute(0))
                .type("FACILITY")
                .requestedByUserId("user-1")
                .requestedByName("John Doe")
                .requestedByEmail("john@example.com")
                .build();
    }

    @Nested
    @DisplayName("Get Bookings Tests")
    class GetBookingsTests {

        @Test
        @DisplayName("Should return all bookings")
        void getAllBookings_ShouldReturnAllBookings() {
            when(bookingRepository.findAll()).thenReturn(Arrays.asList(testBooking));

            List<Booking> result = bookingService.getAllBookings();

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(testBooking.getId(), result.get(0).getId());
            verify(bookingRepository, times(1)).findAll();
        }

        @Test
        @DisplayName("Should return user bookings by user ID")
        void getUserBookings_ShouldReturnUserBookings() {
            when(bookingRepository.findByRequestedByUserId("user-1"))
                    .thenReturn(Arrays.asList(testBooking));

            List<Booking> result = bookingService.getUserBookings("user-1");

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("user-1", result.get(0).getRequestedBy().getUserId());
            verify(bookingRepository, times(1)).findByRequestedByUserId("user-1");
        }

        @Test
        @DisplayName("Should return bookings by resource ID")
        void getBookingsByResourceId_ShouldReturnResourceBookings() {
            when(bookingRepository.findByResourceId("resource-1"))
                    .thenReturn(Arrays.asList(testBooking));

            List<Booking> result = bookingService.getBookingsByResourceId("resource-1");

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("resource-1", result.get(0).getResourceId());
            verify(bookingRepository, times(1)).findByResourceId("resource-1");
        }

        @Test
        @DisplayName("Should return booking by ID with full details")
        void getBookingById_ShouldReturnBookingWithDetails() {
            when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(testBooking));
            when(resourceRepository.findById("resource-1")).thenReturn(Optional.of(testResource));
            when(historyRepository.findByBookingId("booking-1")).thenReturn(Collections.emptyList());

            BookingResponseDto result = bookingService.getBookingById("booking-1");

            assertNotNull(result);
            assertEquals("booking-1", result.getId());
            assertEquals("Conference Room A", result.getResourceName());
            assertEquals("Team Meeting", result.getPurpose());
            verify(bookingRepository, times(1)).findById("booking-1");
        }

        @Test
        @DisplayName("Should throw exception when booking not found")
        void getBookingById_ShouldThrowException_WhenNotFound() {
            when(bookingRepository.findById("non-existent")).thenReturn(Optional.empty());

            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> bookingService.getBookingById("non-existent")
            );

            assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        }
    }

    @Nested
    @DisplayName("Create Booking Tests")
    class CreateBookingTests {

        @Test
        @DisplayName("Should create booking successfully")
        void createBooking_ShouldCreateSuccessfully() {
            when(resourceRepository.findById("resource-1")).thenReturn(Optional.of(testResource));
            when(bookingRepository.findConflictingBookings(
                    eq("resource-1"), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(Collections.emptyList());
            when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

            Booking result = bookingService.createBooking(testRequest);

            assertNotNull(result);
            assertEquals("PENDING", result.getStatus());
            assertEquals("resource-1", result.getResourceId());
            verify(bookingRepository, times(1)).save(any(Booking.class));
        }

        @Test
        @DisplayName("Should throw exception when resource not found")
        void createBooking_ShouldThrowException_WhenResourceNotFound() {
            when(resourceRepository.findById("resource-1")).thenReturn(Optional.empty());

            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> bookingService.createBooking(testRequest)
            );

            assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
            assertTrue(exception.getReason().contains("Resource not found"));
        }

        @Test
        @DisplayName("Should throw exception when resource is out of service")
        void createBooking_ShouldThrowException_WhenResourceOutOfService() {
            testResource.setStatus(ResourceStatus.OUT_OF_SERVICE);
            when(resourceRepository.findById("resource-1")).thenReturn(Optional.of(testResource));

            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> bookingService.createBooking(testRequest)
            );

            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("out of service"));
        }

        @Test
        @DisplayName("Should throw exception when booking conflicts exist")
        void createBooking_ShouldThrowException_WhenConflictExists() {
            when(resourceRepository.findById("resource-1")).thenReturn(Optional.of(testResource));
            when(bookingRepository.findConflictingBookings(
                    eq("resource-1"), any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(Arrays.asList(testBooking));

            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> bookingService.createBooking(testRequest)
            );

            assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
            assertTrue(exception.getReason().contains("already booked"));
        }

        @Test
        @DisplayName("Should throw exception when start time is in the past")
        void createBooking_ShouldThrowException_WhenStartTimeInPast() {
            testRequest.setStartTime(LocalDateTime.now().minusDays(1));
            testRequest.setEndTime(LocalDateTime.now().minusDays(1).plusHours(1));

            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> bookingService.createBooking(testRequest)
            );

            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("past"));
        }

        @Test
        @DisplayName("Should throw exception when start time is after end time")
        void createBooking_ShouldThrowException_WhenInvalidTimeRange() {
            testRequest.setStartTime(LocalDateTime.now().plusDays(2));
            testRequest.setEndTime(LocalDateTime.now().plusDays(1));

            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> bookingService.createBooking(testRequest)
            );

            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("before"));
        }
    }

    @Nested
    @DisplayName("Update Booking Status Tests")
    class UpdateBookingStatusTests {

        @Test
        @DisplayName("Should approve pending booking")
        void updateBookingStatus_ShouldApproveBooking() {
            when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(testBooking));
            when(bookingRepository.findConflictingBookingsExcluding(
                    eq("resource-1"), any(LocalDateTime.class), any(LocalDateTime.class), eq("booking-1")))
                    .thenReturn(Collections.emptyList());
            when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);
            when(historyRepository.save(any(BookingStatusHistory.class)))
                    .thenReturn(BookingStatusHistory.builder().build());

            Booking result = bookingService.updateBookingStatus(
                    "booking-1", "APPROVED", "admin-1", "Looks good");

            assertNotNull(result);
            assertEquals("APPROVED", result.getStatus());
            verify(historyRepository, times(1)).save(any(BookingStatusHistory.class));
        }

        @Test
        @DisplayName("Should reject pending booking with reason")
        void updateBookingStatus_ShouldRejectBooking() {
            when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(testBooking));
            when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);
            when(historyRepository.save(any(BookingStatusHistory.class)))
                    .thenReturn(BookingStatusHistory.builder().build());

            Booking result = bookingService.updateBookingStatus(
                    "booking-1", "REJECTED", "admin-1", "Room not available");

            assertNotNull(result);
            verify(historyRepository, times(1)).save(any(BookingStatusHistory.class));
        }

        @Test
        @DisplayName("Should throw exception for invalid status transition")
        void updateBookingStatus_ShouldThrowException_ForInvalidTransition() {
            testBooking.setStatus("REJECTED");
            when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(testBooking));

            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> bookingService.updateBookingStatus("booking-1", "APPROVED", "admin-1", null)
            );

            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("Invalid status transition"));
        }

        @Test
        @DisplayName("Should throw exception when approving causes conflict")
        void updateBookingStatus_ShouldThrowException_WhenConflictOnApproval() {
            when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(testBooking));
            when(bookingRepository.findConflictingBookingsExcluding(
                    eq("resource-1"), any(LocalDateTime.class), any(LocalDateTime.class), eq("booking-1")))
                    .thenReturn(Arrays.asList(testBooking));

            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> bookingService.updateBookingStatus("booking-1", "APPROVED", "admin-1", null)
            );

            assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        }
    }

    @Nested
    @DisplayName("Cancel Booking Tests")
    class CancelBookingTests {

        @Test
        @DisplayName("Should cancel approved booking by owner")
        void cancelBooking_ShouldCancelApprovedBooking() {
            testBooking.setStatus("APPROVED");
            when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(testBooking));
            when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);
            when(historyRepository.save(any(BookingStatusHistory.class)))
                    .thenReturn(BookingStatusHistory.builder().build());

            Booking result = bookingService.cancelBooking("booking-1", "user-1");

            assertNotNull(result);
            assertEquals("CANCELLED", result.getStatus());
            verify(historyRepository, times(1)).save(any(BookingStatusHistory.class));
        }

        @Test
        @DisplayName("Should cancel pending booking by owner")
        void cancelBooking_ShouldCancelPendingBooking() {
            when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(testBooking));
            when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);
            when(historyRepository.save(any(BookingStatusHistory.class)))
                    .thenReturn(BookingStatusHistory.builder().build());

            Booking result = bookingService.cancelBooking("booking-1", "user-1");

            assertNotNull(result);
            assertEquals("CANCELLED", result.getStatus());
        }

        @Test
        @DisplayName("Should throw exception when cancelling already cancelled booking")
        void cancelBooking_ShouldThrowException_WhenAlreadyCancelled() {
            testBooking.setStatus("CANCELLED");
            when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(testBooking));

            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> bookingService.cancelBooking("booking-1", "user-1")
            );

            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("Only APPROVED or PENDING"));
        }

        @Test
        @DisplayName("Should throw exception when non-owner tries to cancel")
        void cancelBooking_ShouldThrowException_WhenNotOwner() {
            testBooking.setStatus("APPROVED");
            when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(testBooking));

            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> bookingService.cancelBooking("booking-1", "other-user")
            );

            assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
            assertTrue(exception.getReason().contains("only cancel your own"));
        }
    }

    @Nested
    @DisplayName("Availability Check Tests")
    class AvailabilityCheckTests {

        @Test
        @DisplayName("Should return availability for resource on date")
        void checkAvailability_ShouldReturnAvailability() {
            when(resourceRepository.findById("resource-1")).thenReturn(Optional.of(testResource));
            when(bookingRepository.findActiveBookingsByResourceId("resource-1"))
                    .thenReturn(Collections.emptyList());

            AvailabilityResponseDto result = bookingService.checkAvailability(
                    "resource-1", LocalDate.now().plusDays(1));

            assertNotNull(result);
            assertEquals("resource-1", result.getResourceId());
            assertEquals("Conference Room A", result.getResourceName());
            assertTrue(result.isAvailable());
            assertNotNull(result.getAvailableSlots());
        }

        @Test
        @DisplayName("Should return conflicts when bookings exist")
        void checkAvailability_ShouldReturnConflicts() {
            when(resourceRepository.findById("resource-1")).thenReturn(Optional.of(testResource));
            when(bookingRepository.findActiveBookingsByResourceId("resource-1"))
                    .thenReturn(Arrays.asList(testBooking));

            AvailabilityResponseDto result = bookingService.checkAvailability(
                    "resource-1", LocalDate.now().plusDays(1));

            assertNotNull(result);
            assertFalse(result.isAvailable());
            assertEquals(1, result.getConflicts().size());
            assertEquals("Team Meeting", result.getConflicts().get(0).getPurpose());
        }

        @Test
        @DisplayName("Should return not available when resource is out of service")
        void checkAvailability_ShouldReturnNotAvailable_WhenOutOfService() {
            testResource.setStatus(ResourceStatus.OUT_OF_SERVICE);
            when(resourceRepository.findById("resource-1")).thenReturn(Optional.of(testResource));

            AvailabilityResponseDto result = bookingService.checkAvailability(
                    "resource-1", LocalDate.now().plusDays(1));

            assertNotNull(result);
            assertFalse(result.isAvailable());
        }
    }

    @Nested
    @DisplayName("Delete Booking Tests")
    class DeleteBookingTests {

        @Test
        @DisplayName("Should delete existing booking")
        void deleteBooking_ShouldDeleteSuccessfully() {
            when(bookingRepository.existsById("booking-1")).thenReturn(true);
            doNothing().when(bookingRepository).deleteById("booking-1");

            assertDoesNotThrow(() -> bookingService.deleteBooking("booking-1"));
            verify(bookingRepository, times(1)).deleteById("booking-1");
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent booking")
        void deleteBooking_ShouldThrowException_WhenNotFound() {
            when(bookingRepository.existsById("non-existent")).thenReturn(false);

            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> bookingService.deleteBooking("non-existent")
            );

            assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        }
    }

    @Nested
    @DisplayName("Booking History Tests")
    class BookingHistoryTests {

        @Test
        @DisplayName("Should return booking history")
        void getBookingHistory_ShouldReturnHistory() {
            BookingStatusHistory history = BookingStatusHistory.builder()
                    .id("history-1")
                    .bookingId("booking-1")
                    .oldStatus("PENDING")
                    .newStatus("APPROVED")
                    .changedById("admin-1")
                    .note("Approved")
                    .build();

            when(bookingRepository.existsById("booking-1")).thenReturn(true);
            when(historyRepository.findByBookingId("booking-1")).thenReturn(Arrays.asList(history));
            when(userRepository.findById("admin-1")).thenReturn(Optional.empty());

            List<BookingResponseDto.BookingHistoryDto> result = 
                    bookingService.getBookingHistory("booking-1");

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("APPROVED", result.get(0).getNewStatus());
            assertEquals("PENDING", result.get(0).getOldStatus());
        }

        @Test
        @DisplayName("Should throw exception when booking not found for history")
        void getBookingHistory_ShouldThrowException_WhenBookingNotFound() {
            when(bookingRepository.existsById("non-existent")).thenReturn(false);

            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> bookingService.getBookingHistory("non-existent")
            );

            assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        }
    }

    @Nested
    @DisplayName("Pagination Tests")
    class PaginationTests {

        @Test
        @DisplayName("Should return paginated results")
        void getBookingsPaginated_ShouldReturnPaginatedResults() {
            Page<Booking> bookingPage = new PageImpl<>(Arrays.asList(testBooking));
            when(bookingRepository.findAll(any(Pageable.class))).thenReturn(bookingPage);
            when(resourceRepository.findById("resource-1")).thenReturn(Optional.of(testResource));
            when(historyRepository.findByBookingId("booking-1")).thenReturn(Collections.emptyList());

            var result = bookingService.getBookingsPaginated(
                    com.lms.backend.dto.BookingFilterDto.builder()
                            .page(0)
                            .size(10)
                            .sortBy("createdAt")
                            .sortDirection("DESC")
                            .build());

            assertNotNull(result);
            assertEquals(1, result.getContent().size());
            assertEquals(1, result.getTotalElements());
        }

        @Test
        @DisplayName("Should filter by user ID")
        void getBookingsPaginated_ShouldFilterByUserId() {
            Page<Booking> bookingPage = new PageImpl<>(Arrays.asList(testBooking));
            when(bookingRepository.findByRequestedByUserId(eq("user-1"), any(Pageable.class)))
                    .thenReturn(bookingPage);
            when(resourceRepository.findById("resource-1")).thenReturn(Optional.of(testResource));
            when(historyRepository.findByBookingId("booking-1")).thenReturn(Collections.emptyList());

            var result = bookingService.getBookingsPaginated(
                    com.lms.backend.dto.BookingFilterDto.builder()
                            .userId("user-1")
                            .page(0)
                            .size(10)
                            .sortBy("createdAt")
                            .sortDirection("DESC")
                            .build());

            assertNotNull(result);
            assertEquals(1, result.getContent().size());
            verify(bookingRepository, times(1)).findByRequestedByUserId(eq("user-1"), any(Pageable.class));
        }

        @Test
        @DisplayName("Should filter by status")
        void getBookingsPaginated_ShouldFilterByStatus() {
            Page<Booking> bookingPage = new PageImpl<>(Arrays.asList(testBooking));
            when(bookingRepository.findByStatus(eq("PENDING"), any(Pageable.class)))
                    .thenReturn(bookingPage);
            when(resourceRepository.findById("resource-1")).thenReturn(Optional.of(testResource));
            when(historyRepository.findByBookingId("booking-1")).thenReturn(Collections.emptyList());

            var result = bookingService.getBookingsPaginated(
                    com.lms.backend.dto.BookingFilterDto.builder()
                            .status("PENDING")
                            .page(0)
                            .size(10)
                            .sortBy("createdAt")
                            .sortDirection("DESC")
                            .build());

            assertNotNull(result);
            assertEquals(1, result.getContent().size());
            verify(bookingRepository, times(1)).findByStatus(eq("PENDING"), any(Pageable.class));
        }
    }
}
