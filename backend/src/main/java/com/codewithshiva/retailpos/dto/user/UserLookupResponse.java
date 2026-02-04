package com.codewithshiva.retailpos.dto.user;

import com.codewithshiva.retailpos.model.Role;
import com.codewithshiva.retailpos.model.User;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight user response for lookups (cashier filters).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserLookupResponse {
    private Long id;
    private String fullName;
    private Role role;
    @JsonProperty("isActive")
    private boolean isActive;

    public static UserLookupResponse fromUser(User user) {
        return UserLookupResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .role(user.getRole())
                .isActive(user.isActive())
                .build();
    }
}
