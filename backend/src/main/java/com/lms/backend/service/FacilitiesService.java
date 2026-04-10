package com.lms.backend.service;

import com.lms.backend.controller.UpdateResourceStatusDto;
import com.lms.backend.dto.ResourceRequestDto;
import com.lms.backend.dto.ResourceResponseDto;
import com.lms.backend.enums.ResourceCategory;
import com.lms.backend.enums.ResourceStatus;
import com.lms.backend.exception.ResourceNotFoundException;
import com.lms.backend.model.Resource;
import com.lms.backend.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FacilitiesService {

    private final ResourceRepository resourceRepository;

    public List<ResourceResponseDto> getResources(
            ResourceCategory category,
            String type,
            ResourceStatus status,
            String campusName,
            Integer minCapacity,
            String search) {
        
        List<Resource> resources = resourceRepository.findAll();
        
        return resources.stream()
                .filter(resource -> {
                    if (category != null && resource.getCategory() != category) {
                        return false;
                    }
                    if (type != null && !type.isEmpty() && 
                            !type.equalsIgnoreCase(resource.getType())) {
                        return false;
                    }
                    if (status != null && resource.getStatus() != status) {
                        return false;
                    }
                    if (campusName != null && !campusName.isEmpty()) {
                        if (resource.getCampusName() == null || 
                            !resource.getCampusName().equalsIgnoreCase(campusName)) {
                            return false;
                        }
                    }
                    if (minCapacity != null) {
                        if (resource.getCapacity() == null || 
                            resource.getCapacity() < minCapacity) {
                            return false;
                        }
                    }
                    if (search != null && !search.isEmpty()) {
                        String searchLower = search.toLowerCase();
                        boolean matches = false;
                        if (resource.getResourceName() != null && 
                            resource.getResourceName().toLowerCase().contains(searchLower)) {
                            matches = true;
                        }
                        if (resource.getType() != null && 
                            resource.getType().toLowerCase().contains(searchLower)) {
                            matches = true;
                        }
                        if (resource.getResourceCode() != null && 
                            resource.getResourceCode().toLowerCase().contains(searchLower)) {
                            matches = true;
                        }
                        if (resource.getDescription() != null && 
                            resource.getDescription().toLowerCase().contains(searchLower)) {
                            matches = true;
                        }
                        if (!matches) return false;
                    }
                    return true;
                })
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    public ResourceResponseDto getResourceById(String id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
        return toResponseDto(resource);
    }

    public ResourceResponseDto createResource(ResourceRequestDto requestDto) {
        Resource resource = toEntity(requestDto);
        
        if (resource.getResourceCode() == null || resource.getResourceCode().isEmpty()) {
            resource.setResourceCode("RES-" + System.currentTimeMillis());
        }
        
        Resource saved = resourceRepository.save(resource);
        return toResponseDto(saved);
    }

    public ResourceResponseDto updateResource(String id, ResourceRequestDto requestDto) {
        Resource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
        
        existing.setResourceName(requestDto.getResourceName());
        existing.setCategory(requestDto.getCategory());
        existing.setType(requestDto.getType());
        existing.setDescription(requestDto.getDescription());
        existing.setLocation(requestDto.getLocation() != null ? requestDto.getLocation() : requestDto.getCampusName());
        existing.setCampusName(requestDto.getCampusName() != null ? requestDto.getCampusName() : requestDto.getLocation());
        existing.setBuilding(requestDto.getBuilding() != null ? requestDto.getBuilding() : requestDto.getLocation());
        existing.setRoomNumber(requestDto.getRoomNumber());
        existing.setCapacity(requestDto.getCapacity());
        existing.setStorageLocation(requestDto.getStorageLocation() != null ? requestDto.getStorageLocation() : requestDto.getLocation());
        existing.setCustomType(requestDto.getCustomType());
        existing.setAmenities(requestDto.getAmenities());
        existing.setStatus(requestDto.getStatus());
        existing.setSerialNumber(requestDto.getSerialNumber());
        existing.setAvailableFrom(requestDto.getAvailableFrom());
        existing.setAvailableTo(requestDto.getAvailableTo());
        
        if (requestDto.getAvailabilityWindows() != null) {
            existing.setAvailabilityWindows(requestDto.getAvailabilityWindows().stream()
                    .map(w -> Resource.AvailabilityWindow.builder()
                            .dayOfWeek(w.getDayOfWeek())
                            .startTime(w.getStartTime())
                            .endTime(w.getEndTime())
                            .isAvailable(w.getIsAvailable())
                            .build())
                    .collect(Collectors.toList()));
        }
        
        Resource saved = resourceRepository.save(existing);
        return toResponseDto(saved);
    }

    public ResourceResponseDto updateResourceStatus(String id, UpdateResourceStatusDto requestDto) {
        Resource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
        
        existing.setStatus(requestDto.getStatus());
        Resource saved = resourceRepository.save(existing);
        return toResponseDto(saved);
    }

    public void deleteResource(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }

    private Resource toEntity(ResourceRequestDto dto) {
        String loc = dto.getLocation() != null ? dto.getLocation() : dto.getCampusName();
        return Resource.builder()
                .resourceName(dto.getResourceName())
                .category(dto.getCategory())
                .type(dto.getType())
                .description(dto.getDescription())
                .location(loc)
                .campusName(loc)
                .building(loc)
                .roomNumber(dto.getRoomNumber())
                .capacity(dto.getCapacity())
                .storageLocation(dto.getStorageLocation() != null ? dto.getStorageLocation() : loc)
                .customType(dto.getCustomType())
                .amenities(dto.getAmenities())
                .status(dto.getStatus() != null ? dto.getStatus() : ResourceStatus.ACTIVE)
                .availableFrom(dto.getAvailableFrom())
                .availableTo(dto.getAvailableTo())
                .serialNumber(dto.getSerialNumber())
                .build();
    }

    private ResourceResponseDto toResponseDto(Resource resource) {
        List<ResourceResponseDto.AvailabilityWindowDto> windows = null;
        if (resource.getAvailabilityWindows() != null) {
            windows = resource.getAvailabilityWindows().stream()
                    .map(w -> ResourceResponseDto.AvailabilityWindowDto.builder()
                            .dayOfWeek(w.getDayOfWeek())
                            .startTime(w.getStartTime())
                            .endTime(w.getEndTime())
                            .isAvailable(w.getIsAvailable())
                            .build())
                    .collect(Collectors.toList());
        }
        
        return ResourceResponseDto.builder()
                .id(resource.getId())
                .resourceCode(resource.getResourceCode())
                .category(resource.getCategory())
                .type(resource.getType())
                .status(resource.getStatus())
                .resourceName(resource.getResourceName())
                .description(resource.getDescription())
                .campusName(resource.getCampusName())
                .building(resource.getBuilding())
                .roomNumber(resource.getRoomNumber())
                .capacity(resource.getCapacity())
                .storageLocation(resource.getStorageLocation())
                .customType(resource.getCustomType())
                .amenities(resource.getAmenities())
                .availableFrom(resource.getAvailableFrom())
                .availableTo(resource.getAvailableTo())
                .availabilityWindows(windows)
                .requiresAttendanceCount(resource.getRequiresAttendanceCount())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .serialNumber(resource.getSerialNumber())
                .location(resource.getLocation())
                .build();
    }
}
