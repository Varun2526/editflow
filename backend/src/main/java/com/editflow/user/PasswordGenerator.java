package com.editflow.user;

import java.security.SecureRandom;
import org.springframework.stereotype.Component;

/** Temporary portal passwords: random, and free of look-alike characters (0/O, 1/l/I) for WhatsApp sharing. */
@Component
public class PasswordGenerator {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final int LENGTH = 12;

    private final SecureRandom random = new SecureRandom();

    public String generate() {
        StringBuilder password = new StringBuilder(LENGTH);
        for (int i = 0; i < LENGTH; i++) {
            password.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return password.toString();
    }
}
