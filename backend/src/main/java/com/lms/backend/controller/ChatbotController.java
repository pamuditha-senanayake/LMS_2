package com.lms.backend.controller;

import com.lms.backend.dto.ChatResponse;
import com.lms.backend.model.Resource;
import com.lms.backend.repository.ResourceRepository;
import com.lms.backend.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final ResourceRepository resourceRepository;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody Map<String, String> request) {
        String userMessage = request.get("message");
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ChatResponse.builder().error("Message cannot be empty").build());
        }
        
        try {
            String rawResponse = chatbotService.chat(userMessage);
            
            // Extract resource IDs tagged with [[RES:id]]
            List<Resource> resources = new ArrayList<>();
            Pattern resPattern = Pattern.compile("\\[\\[RES:([^\\]]+)\\]\\]");
            Matcher resMatcher = resPattern.matcher(rawResponse);
            
            while (resMatcher.find()) {
                String resourceId = resMatcher.group(1);
                resourceRepository.findById(resourceId).ifPresent(resources::add);
            }
            
            // Extract booking info tagged with [[BOOKING:date,start,end]]
            String date = null;
            String startTime = null;
            String endTime = null;
            Pattern bookingPattern = Pattern.compile("\\[\\[BOOKING:([^,]+),([^,]+),([^\\]]+)\\]\\]");
            Matcher bookingMatcher = bookingPattern.matcher(rawResponse);
            
            if (bookingMatcher.find()) {
                date = bookingMatcher.group(1);
                startTime = bookingMatcher.group(2);
                endTime = bookingMatcher.group(3);
            }
            
            // Strip all tags from the final response
            String cleanResponse = rawResponse
                    .replaceAll("\\[\\[RES:[^\\]]+\\]\\]", "")
                    .replaceAll("\\[\\[BOOKING:[^\\]]+\\]\\]", "")
                    .trim();
            
            return ResponseEntity.ok(ChatResponse.builder()
                    .response(cleanResponse)
                    .resources(resources)
                    .date(date)
                    .startTime(startTime)
                    .endTime(endTime)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ChatResponse.builder()
                    .error("AI Service Error: " + e.getMessage())
                    .build());
        }
    }
}
