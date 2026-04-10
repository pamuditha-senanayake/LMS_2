package com.lms.backend.config;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SseConfig {

    private final Map<String, SseEmitter> userEmitters = new ConcurrentHashMap<>();

    public SseEmitter createEmitter(String userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        
        emitter.onCompletion(() -> removeEmitter(userId));
        emitter.onTimeout(() -> removeEmitter(userId));
        emitter.onError(e -> removeEmitter(userId));

        userEmitters.put(userId, emitter);

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("connected"));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }

        return emitter;
    }

    public void removeEmitter(String userId) {
        SseEmitter emitter = userEmitters.remove(userId);
        if (emitter != null) {
            emitter.complete();
        }
    }

    public void sendToUser(String userId, String eventName, Object data) {
        SseEmitter emitter = userEmitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (IOException e) {
                removeEmitter(userId);
            }
        }
    }

    public int getActiveConnections() {
        return userEmitters.size();
    }
}
