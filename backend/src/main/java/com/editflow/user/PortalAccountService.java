package com.editflow.user;

import com.editflow.client.Client;
import com.editflow.common.exception.ConflictException;
import com.editflow.user.dto.PortalCredentials;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Creates or resets a client's portal login. The temporary password must be changed on first login. */
@Service
public class PortalAccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordGenerator passwordGenerator;

    public PortalAccountService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                PasswordGenerator passwordGenerator) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordGenerator = passwordGenerator;
    }

    @Transactional
    public PortalCredentials createFor(Client client) {
        if (client.getUser() != null) {
            throw new ConflictException("This client already has portal access");
        }
        if (userRepository.existsByEmail(client.getEmail())) {
            throw new ConflictException("Another account already uses " + client.getEmail());
        }
        String temporaryPassword = passwordGenerator.generate();
        User user = userRepository.save(new User(
                client.getName(), client.getEmail(), passwordEncoder.encode(temporaryPassword), Role.CLIENT, true));
        client.setUser(user);
        return new PortalCredentials(user.getEmail(), temporaryPassword);
    }

    /** Creates access if missing, otherwise issues a new temporary password. */
    @Transactional
    public PortalCredentials createOrReset(Client client) {
        if (client.getUser() == null) {
            return createFor(client);
        }
        String temporaryPassword = passwordGenerator.generate();
        User user = client.getUser();
        user.resetPassword(passwordEncoder.encode(temporaryPassword));
        return new PortalCredentials(user.getEmail(), temporaryPassword);
    }
}
