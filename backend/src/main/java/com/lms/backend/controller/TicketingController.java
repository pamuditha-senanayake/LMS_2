package com.lms.backend.controller;

import com.lms.backend.model.IncidentTicket;
import com.lms.backend.model.TicketAttachment;
import com.lms.backend.model.TicketComment;
import com.lms.backend.service.FileStorageService;
import com.lms.backend.service.TicketingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketingController {

    private final TicketingService ticketingService;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<List<IncidentTicket>> getAllTickets(@RequestParam(required = false) String userId) {
        if (userId != null) {
            return ResponseEntity.ok(ticketingService.getTicketsByReportedUser(userId));
        }
        return ResponseEntity.ok(ticketingService.getAllTickets());
    }

    @PostMapping
    public ResponseEntity<IncidentTicket> createTicket(@Valid @RequestBody IncidentTicket ticket) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketingService.createTicket(ticket));
    }

    @PostMapping("/with-attachments")
    public ResponseEntity<?> createTicketWithAttachments(
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam(required = false) String resourceId,
            @RequestParam String priority,
            @RequestParam String reportedById,
            @RequestParam(required = false) List<MultipartFile> images) {
        
        IncidentTicket ticket = IncidentTicket.builder()
                .title(title)
                .description(description)
                .resourceId(resourceId)
                .priority(priority)
                .reportedById(reportedById)
                .status("OPEN")
                .build();
        
        IncidentTicket createdTicket = ticketingService.createTicket(ticket);
        
        List<TicketAttachment> attachments = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            for (MultipartFile image : images) {
                if (!image.isEmpty()) {
                    String fileUrl = fileStorageService.storeFile(image);
                    TicketAttachment attachment = TicketAttachment.builder()
                            .ticketId(createdTicket.getId())
                            .fileName(image.getOriginalFilename())
                            .fileUrl(fileUrl)
                            .fileType(image.getContentType())
                            .fileSize(image.getSize())
                            .uploadedById(reportedById)
                            .build();
                    attachments.add(ticketingService.addAttachment(attachment));
                }
            }
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(new TicketWithAttachmentsResponse(createdTicket, attachments));
    }

    @PatchMapping("/{ticketId}/status")
    public ResponseEntity<IncidentTicket> updateStatus(
            @PathVariable String ticketId,
            @RequestParam String status,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) String adminId) {
        return ResponseEntity.ok(ticketingService.updateTicketStatus(ticketId, status, note, adminId));
    }

    @GetMapping("/{ticketId}/attachments")
    public ResponseEntity<List<TicketAttachment>> getAttachments(@PathVariable String ticketId) {
        return ResponseEntity.ok(ticketingService.getTicketAttachments(ticketId));
    }

    @PostMapping("/{ticketId}/attachments")
    public ResponseEntity<TicketAttachment> addAttachment(@PathVariable String ticketId, @Valid @RequestBody TicketAttachment attachment) {
        attachment.setTicketId(ticketId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketingService.addAttachment(attachment));
    }

    @PostMapping("/{ticketId}/upload-attachments")
    public ResponseEntity<List<TicketAttachment>> uploadAttachments(
            @PathVariable String ticketId,
            @RequestParam(required = false) List<MultipartFile> images,
            @RequestParam String uploadedById) {
        
        List<TicketAttachment> attachments = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            for (MultipartFile image : images) {
                if (!image.isEmpty()) {
                    String fileUrl = fileStorageService.storeFile(image);
                    TicketAttachment attachment = TicketAttachment.builder()
                            .ticketId(ticketId)
                            .fileName(image.getOriginalFilename())
                            .fileUrl(fileUrl)
                            .fileType(image.getContentType())
                            .fileSize(image.getSize())
                            .uploadedById(uploadedById)
                            .build();
                    attachments.add(ticketingService.addAttachment(attachment));
                }
            }
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(attachments);
    }

    @GetMapping("/{ticketId}/comments")
    public ResponseEntity<List<TicketComment>> getComments(@PathVariable String ticketId) {
        return ResponseEntity.ok(ticketingService.getTicketComments(ticketId));
    }

    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<TicketComment> addComment(@PathVariable String ticketId, @Valid @RequestBody TicketComment comment) {
        comment.setTicketId(ticketId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketingService.addComment(comment));
    }

    @DeleteMapping("/{ticketId}")
    public ResponseEntity<Void> deleteTicket(@PathVariable String ticketId) {
        ticketingService.deleteTicket(ticketId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{ticketId}")
    public ResponseEntity<IncidentTicket> updateTicket(
            @PathVariable String ticketId,
            @RequestBody IncidentTicket updates) {
        return ResponseEntity.ok(ticketingService.updateTicket(ticketId, updates));
    }

    public record TicketWithAttachmentsResponse(IncidentTicket ticket, List<TicketAttachment> attachments) {}

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = ticketingService.getTicketStatistics();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/statistics/volume")
    public ResponseEntity<Map<String, Object>> getVolumeByDay(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ticketingService.getTicketVolumeByDay(days));
    }

    @GetMapping("/statistics/staff")
    public ResponseEntity<Map<String, Long>> getStaffPerformance() {
        return ResponseEntity.ok(ticketingService.getTicketCountByAssignedStaff());
    }
}
