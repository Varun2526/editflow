package com.editflow.support;

import com.editflow.security.CurrentUser;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test-only endpoints inside the protected URL spaces, so role rules can be verified before the
 * real admin/client APIs exist. Lives in src/test and is never packaged.
 */
@RestController
class SecurityProbeController {

    private final CurrentUser currentUser;

    SecurityProbeController(CurrentUser currentUser) {
        this.currentUser = currentUser;
    }

    @GetMapping("/api/admin/_probe")
    Map<String, Object> admin() {
        return Map.of("userId", currentUser.userId());
    }

    @GetMapping("/api/client/me/_probe")
    Map<String, Object> client() {
        return Map.of("clientId", currentUser.clientId());
    }
}
