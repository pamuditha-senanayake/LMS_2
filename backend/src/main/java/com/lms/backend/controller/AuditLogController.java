package com.lms.backend.controller;

import com.lms.backend.model.AuditLog;
import com.lms.backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<List<AuditLog>> getLogsForEntity(
            @PathVariable String entityType, 
            @PathVariable String entityId) {
        return ResponseEntity.ok(auditLogService.getLogsForEntity(entityType, entityId));
    }
}
