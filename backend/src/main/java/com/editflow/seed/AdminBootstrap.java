package com.editflow.seed;

import com.editflow.common.config.AppProperties;
import com.editflow.common.util.Emails;
import com.editflow.user.Role;
import com.editflow.user.User;
import com.editflow.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD when no admin exists.
 * Runs in every profile, so production needs no demo data to get a login; credentials are never hardcoded.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);
    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties.Admin config;

    public AdminBootstrap(UserRepository userRepository, PasswordEncoder passwordEncoder, AppProperties properties) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.config = properties.admin();
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByRole(Role.ADMIN)) {
            return;
        }
        if (!StringUtils.hasText(config.email()) || !StringUtils.hasText(config.password())) {
            log.warn("No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one on startup.");
            return;
        }
        if (config.password().length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalStateException("ADMIN_PASSWORD must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
        String email = Emails.normalize(config.email());
        if (userRepository.existsByEmail(email)) {
            throw new IllegalStateException("ADMIN_EMAIL belongs to an existing non-admin account: " + email);
        }
        String name = StringUtils.hasText(config.name()) ? config.name() : "EditFlow Admin";
        userRepository.save(new User(name, email, passwordEncoder.encode(config.password()), Role.ADMIN, false));
        log.info("Created admin account {}", email);
    }
}
