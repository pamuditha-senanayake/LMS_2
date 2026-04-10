package com.lms.backend.controller;

import com.lms.backend.dto.AvailabilityResponseDto;
import com.lms.backend.dto.ResourceRequestDto;
import com.lms.backend.dto.ResourceResponseDto;
import com.lms.backend.enums.ResourceCategory;
import com.lms.backend.enums.ResourceStatus;
import com.lms.backend.service.BookingService;
import com.lms.backend.service.FacilitiesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class FacilitiesController {

    private final FacilitiesService facilitiesService;
    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<List<ResourceResponseDto>> getResources(
            @RequestParam(required = false) ResourceCategory category,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) String campusName,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String search) {

        List<ResourceResponseDto> resources = facilitiesService.getResources(
                category, type, status, campusName, minCapacity, search);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponseDto> getResourceById(@PathVariable String id) {
        ResourceResponseDto resource = facilitiesService.getResourceById(id);
        return ResponseEntity.ok(resource);
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<AvailabilityResponseDto> checkAvailability(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(bookingService.checkAvailability(id, date));
    }

    @PostMapping
    public ResponseEntity<ResourceResponseDto> createResource(
            @Valid @RequestBody ResourceRequestDto requestDto) {
        ResourceResponseDto createdResource = facilitiesService.createResource(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdResource);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResourceResponseDto> updateResource(
            @PathVariable String id,
            @Valid @RequestBody ResourceRequestDto requestDto) {
        ResourceResponseDto updatedResource = facilitiesService.updateResource(id, requestDto);
        return ResponseEntity.ok(updatedResource);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ResourceResponseDto> updateResourceStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateResourceStatusDto requestDto) {
        ResourceResponseDto updatedResource = facilitiesService.updateResourceStatus(id, requestDto);
        return ResponseEntity.ok(updatedResource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable String id) {
        facilitiesService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}
