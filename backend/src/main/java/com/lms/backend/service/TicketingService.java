package com.lms.backend.service;

import com.lms.backend.dto.TicketUpdateRequest;
import com.lms.backend.model.IncidentTicket;
import com.lms.backend.model.Notification;
import com.lms.backend.model.TicketAttachment;
import com.lms.backend.model.TicketComment;
import com.lms.backend.repository.IncidentTicketRepository;
import com.lms.backend.repository.TicketAttachmentRepository;
import com.lms.backend.repository.TicketCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TicketingService {

    private final IncidentTicketRepository ticketRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;
    private final NotificationService notificationService;

    // Tickets
    public List<IncidentTicket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public Map<String, Object> getTicketStatistics() {
        List<IncidentTicket> allTickets = ticketRepository.findAll();
        
        Map<String, Object> stats = new HashMap<>();
        
        long total = allTickets.size();
        long open = allTickets.stream().filter(t -> "OPEN".equals(t.getStatus())).count();
        long inProgress = allTickets.stream().filter(t -> "IN_PROGRESS".equals(t.getStatus())).count();
        long resolved = allTickets.stream().filter(t -> "RESOLVED".equals(t.getStatus()) || "CLOSED".equals(t.getStatus())).count();
        long rejected = allTickets.stream().filter(t -> "REJECTED".equals(t.getStatus())).count();
        
        long critical = allTickets.stream().filter(t -> "CRITICAL".equals(t.getPriority())).count();
        long high = allTickets.stream().filter(t -> "HIGH".equals(t.getPriority())).count();
        long medium = allTickets.stream().filter(t -> "MEDIUM".equals(t.getPriority())).count();
        long low = allTickets.stream().filter(t -> "LOW".equals(t.getPriority())).count();
        
        long resolvedWithTime = allTickets.stream()
            .filter(t -> t.getResolvedAt() != null && t.getCreatedAt() != null)
            .count();
        
        double avgResolutionHours = allTickets.stream()
            .filter(t -> t.getResolvedAt() != null && t.getCreatedAt() != null)
            .mapToLong(t -> ChronoUnit.HOURS.between(t.getCreatedAt(), t.getResolvedAt()))
            .average()
            .orElse(0.0);
        
        stats.put("total", total);
        stats.put("open", open);
        stats.put("inProgress", inProgress);
        stats.put("resolved", resolved);
        stats.put("rejected", rejected);
        stats.put("critical", critical);
        stats.put("high", high);
        stats.put("medium", medium);
        stats.put("low", low);
        stats.put("avgResolutionHours", Math.round(avgResolutionHours * 10) / 10.0);
        stats.put("resolvedWithTime", resolvedWithTime);
        
        return stats;
    }

    public Map<String, Object> getTicketVolumeByDay(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = now.minusDays(days);
        List<IncidentTicket> allTickets = ticketRepository.findAll();
        
        Map<String, Long> volumeByDay = new HashMap<>();
        for (int i = 0; i < days; i++) {
            LocalDateTime day = startDate.plusDays(i);
            String dayKey = day.toLocalDate().toString();
            volumeByDay.put(dayKey, 0L);
        }
        
        for (IncidentTicket ticket : allTickets) {
            if (ticket.getCreatedAt() != null && ticket.getCreatedAt().isAfter(startDate)) {
                String dayKey = ticket.getCreatedAt().toLocalDate().toString();
                volumeByDay.merge(dayKey, 1L, Long::sum);
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("volumeByDay", volumeByDay);
        result.put("days", days);
        return result;
    }

    public Map<String, Long> getTicketCountByAssignedStaff() {
        List<IncidentTicket> allTickets = ticketRepository.findAll();
        
        Map<String, Long> countByStaff = new HashMap<>();
        for (IncidentTicket ticket : allTickets) {
            String staffId = ticket.getAssignedToId();
            if (staffId != null && !staffId.isEmpty()) {
                countByStaff.merge(staffId, 1L, Long::sum);
            } else {
                countByStaff.merge("Unassigned", 1L, Long::sum);
            }
        }
        
        return countByStaff;
    }

    public List<IncidentTicket> getTicketsByReportedUser(String userId) {
        return ticketRepository.findByReportedById(userId);
    }

    public IncidentTicket createTicket(IncidentTicket ticket) {
        ticket.setStatus("OPEN");
        ticket.setCreatedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }

    public IncidentTicket updateTicketStatus(String ticketId, String status, String note, String adminId) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        
        String previousStatus = ticket.getStatus();
        ticket.setStatus(status);
        if ("RESOLVED".equals(status)) {
            ticket.setResolvedAt(LocalDateTime.now());
            ticket.setResolutionNotes(note);
        } else if ("CLOSED".equals(status)) {
            ticket.setClosedAt(LocalDateTime.now());
        } else if ("REJECTED".equals(status)) {
            ticket.setRejectionReason(note);
            ticket.setRejectedById(adminId);
        }
        
        IncidentTicket savedTicket = ticketRepository.save(ticket);
        
        if (savedTicket.getReportedById() != null && !savedTicket.getReportedById().isEmpty()) {
            String statusMessage = formatStatusMessage(status);
            Notification notification = Notification.builder()
                    .recipientUserId(savedTicket.getReportedById())
                    .createdById(adminId != null ? adminId : "SYSTEM")
                    .notificationType("STATUS_CHANGE")
                    .title("Ticket Status Updated")
                    .message("Your ticket '" + savedTicket.getTitle() + "' has been updated from " + formatStatus(previousStatus) + " to " + statusMessage)
                    .relatedEntityType("TICKET")
                    .relatedEntityId(ticketId)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationService.createNotification(notification);
        }
        
        return savedTicket;
    }
    
    private String formatStatus(String status) {
        if (status == null) return "Unknown";
        return status.replace("_", " ");
    }
    
    private String formatStatusMessage(String status) {
        return switch (status) {
            case "OPEN" -> "Open";
            case "IN_PROGRESS" -> "In Progress";
            case "RESOLVED" -> "Resolved";
            case "REJECTED" -> "Rejected";
            case "CLOSED" -> "Closed";
            default -> status;
        };
    }

    // Attachments
    public List<TicketAttachment> getTicketAttachments(String ticketId) {
        return attachmentRepository.findByTicketId(ticketId);
    }
    
    public TicketAttachment addAttachment(TicketAttachment attachment) {
        return attachmentRepository.save(attachment);
    }

    // Comments
    public List<TicketComment> getTicketComments(String ticketId) {
        return commentRepository.findByTicketId(ticketId);
    }
    
    public TicketComment addComment(TicketComment comment) {
        comment.setCreatedAt(LocalDateTime.now());
        TicketComment savedComment = commentRepository.save(comment);
        
        IncidentTicket ticket = ticketRepository.findById(comment.getTicketId()).orElse(null);
        if (ticket != null && ticket.getReportedById() != null && !ticket.getReportedById().isEmpty()) {
            if (!ticket.getReportedById().equals(comment.getAuthorId())) {
                Notification notification = Notification.builder()
                        .recipientUserId(ticket.getReportedById())
                        .createdById(comment.getAuthorId())
                        .notificationType("COMMENT_ADDED")
                        .title("New Comment on Your Ticket")
                        .message("A new comment was added to your ticket '" + ticket.getTitle() + "': " + truncateText(comment.getCommentText(), 50))
                        .relatedEntityType("TICKET")
                        .relatedEntityId(comment.getTicketId())
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationService.createNotification(notification);
            }
        }
        
        return savedComment;
    }
    
    private String truncateText(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    }

    public void deleteTicket(String ticketId) {
        ticketRepository.deleteById(ticketId);
    }

    public IncidentTicket updateTicket(String ticketId, TicketUpdateRequest updates) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        
        if (updates.getTitle() != null && !updates.getTitle().isBlank()) {
            ticket.setTitle(updates.getTitle());
        }
        if (updates.getDescription() != null && !updates.getDescription().isBlank()) {
            ticket.setDescription(updates.getDescription());
        }
        if (updates.getResourceId() != null) {
            ticket.setResourceId(updates.getResourceId());
        }
        if (updates.getPriority() != null && !updates.getPriority().isBlank()) {
            ticket.setPriority(updates.getPriority());
        }
        if (updates.getCategory() != null) {
            ticket.setCategory(updates.getCategory());
        }
        
        return ticketRepository.save(ticket);
    }
}
