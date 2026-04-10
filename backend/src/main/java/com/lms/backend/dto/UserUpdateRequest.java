package com.lms.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Data
public class UserUpdateRequest {
    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    private List<String> roles;
}
