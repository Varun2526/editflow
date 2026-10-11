package com.editflow.auth;

import com.editflow.auth.dto.ChangePasswordRequest;
import com.editflow.auth.dto.LoginRequest;
import com.editflow.auth.dto.LoginResponse;
import com.editflow.auth.dto.UserResponse;
import com.editflow.common.exception.AuthenticationFailedException;
import com.editflow.common.exception.BusinessRuleException;
import com.editflow.common.util.Emails;
import com.editflow.security.CurrentUser;
import com.editflow.security.JwtService;
import com.editflow.security.JwtService.IssuedToken;
import com.editflow.user.User;
import com.editflow.user.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    static final String INVALID_CREDENTIALS = "Invalid email or password";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentUser currentUser;
    private final LoginThrottle loginThrottle;
    /** Compared against when the email is unknown, so response time doesn't reveal which emails exist. */
    private final String unknownUserHash;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, CurrentUser currentUser, LoginThrottle loginThrottle) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.currentUser = currentUser;
        this.loginThrottle = loginThrottle;
        this.unknownUserHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = Emails.normalize(request.email());
        loginThrottle.checkAllowed(email);
        Optional<User> user = userRepository.findByEmail(email);
        boolean passwordMatches = passwordEncoder.matches(
                request.password(), user.map(User::getPasswordHash).orElse(unknownUserHash));
        if (user.isEmpty() || !passwordMatches) {
            loginThrottle.recordFailure(email);
            throw new AuthenticationFailedException(INVALID_CREDENTIALS);
        }
        loginThrottle.recordSuccess(email);
        return toLoginResponse(user.get());
    }

    @Transactional(readOnly = true)
    public UserResponse me() {
        return UserResponse.from(loadCurrentUser());
    }

    /** Returns a fresh token, because the old one may still carry the password-change flag. */
    @Transactional
    public LoginResponse changePassword(ChangePasswordRequest request) {
        User user = loadCurrentUser();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            // 400 rather than 401: the session itself is valid and must not be logged out.
            throw new BusinessRuleException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("New password must be different from the current password");
        }
        user.changePassword(passwordEncoder.encode(request.newPassword()));
        return toLoginResponse(user);
    }

    private User loadCurrentUser() {
        // A valid token for a deleted account is treated as unauthenticated.
        return userRepository.findById(currentUser.userId())
                .orElseThrow(() -> new AuthenticationFailedException("Account no longer exists"));
    }

    private LoginResponse toLoginResponse(User user) {
        IssuedToken token = jwtService.issue(user);
        return new LoginResponse(token.value(), "Bearer", token.expiresAt(), UserResponse.from(user));
    }
}
