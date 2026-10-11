package com.editflow.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.editflow.auth.dto.ChangePasswordRequest;
import com.editflow.auth.dto.LoginRequest;
import com.editflow.auth.dto.LoginResponse;
import com.editflow.common.exception.AuthenticationFailedException;
import com.editflow.common.exception.BusinessRuleException;
import com.editflow.security.CurrentUser;
import com.editflow.security.JwtService;
import com.editflow.user.Role;
import com.editflow.user.User;
import com.editflow.user.UserRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final JwtService jwtService = mock(JwtService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private AuthService authService;

    @BeforeEach
    void setUp() {
        when(passwordEncoder.encode(anyString())).thenAnswer(inv -> "hashed:" + inv.getArgument(0));
        when(jwtService.issue(any())).thenReturn(new JwtService.IssuedToken("token", Instant.EPOCH));
        authService = new AuthService(userRepository, passwordEncoder, jwtService, currentUser, mock(LoginThrottle.class));
    }

    @Test
    void unknownEmailStillPerformsAPasswordComparison() {
        when(userRepository.findByEmail("nobody@editflow.test")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@editflow.test", "pw")))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage(AuthService.INVALID_CREDENTIALS);
        verify(passwordEncoder).matches(eq("pw"), anyString());
    }

    @Test
    void wrongPasswordUsesTheSameMessageAsUnknownEmail() {
        User user = new User("Admin", "admin@editflow.test", "stored", Role.ADMIN, false);
        when(userRepository.findByEmail("admin@editflow.test")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "stored")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("Admin@EditFlow.test", "wrong")))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage(AuthService.INVALID_CREDENTIALS);
    }

    @Test
    void changePasswordRequiresTheCurrentPassword() {
        User user = currentUserIs(new User("Client", "c@editflow.test", "stored", Role.CLIENT, true));
        when(passwordEncoder.matches("wrong", "stored")).thenReturn(false);

        assertThatThrownBy(() -> authService.changePassword(new ChangePasswordRequest("wrong", "New-Password-1")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("Current password is incorrect");
        assertThat(user.isMustChangePassword()).isTrue();
    }

    @Test
    void changePasswordRejectsReusingTheSamePassword() {
        currentUserIs(new User("Client", "c@editflow.test", "stored", Role.CLIENT, true));
        when(passwordEncoder.matches("same-password", "stored")).thenReturn(true);

        assertThatThrownBy(() -> authService.changePassword(new ChangePasswordRequest("same-password", "same-password")))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void changePasswordStoresNewHashAndClearsTheFlag() {
        User user = currentUserIs(new User("Client", "c@editflow.test", "stored", Role.CLIENT, true));
        when(passwordEncoder.matches("temp-pass", "stored")).thenReturn(true);
        when(passwordEncoder.matches("New-Password-1", "stored")).thenReturn(false);

        LoginResponse response = authService.changePassword(new ChangePasswordRequest("temp-pass", "New-Password-1"));

        assertThat(user.getPasswordHash()).isEqualTo("hashed:New-Password-1");
        assertThat(user.isMustChangePassword()).isFalse();
        assertThat(response.user().mustChangePassword()).isFalse();
    }

    private User currentUserIs(User user) {
        when(currentUser.userId()).thenReturn(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        return user;
    }
}
