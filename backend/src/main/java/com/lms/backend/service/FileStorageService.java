package com.lms.backend.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    private Path uploadPath;

    @PostConstruct
    public void init() {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        
        // If running from root on Railway, ./uploads might point to PROJECT_ROOT/uploads.
        // If that doesn't exist but backend/uploads does, use that.
        if (!Files.exists(this.uploadPath) && Files.exists(Paths.get("./backend/uploads"))) {
            this.uploadPath = Paths.get("./backend/uploads").toAbsolutePath().normalize();
            log.info("Using backend/uploads as fallback for storage: {}", uploadPath);
        }

        try {
            Files.createDirectories(uploadPath);
            log.info("Upload directory ready at: {}", uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            return null;
        }

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null) {
            return null;
        }

        String fileExtension = "";
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex > 0) {
            fileExtension = originalFileName.substring(dotIndex);
        }

        String fileName = UUID.randomUUID().toString() + fileExtension;

        try {
            Path targetLocation = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            String fileUrl = "/uploads/" + fileName;
            log.info("Stored file: {} at {}", fileName, targetLocation);
            return fileUrl;
        } catch (IOException e) {
            log.error("Failed to store file", e);
            throw new RuntimeException("Failed to store file", e);
        }
    }
}
