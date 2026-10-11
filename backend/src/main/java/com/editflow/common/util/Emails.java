package com.editflow.common.util;

import java.util.Locale;

public final class Emails {

    private Emails() {
    }

    /** Emails are stored and compared lower-cased (enforced by a DB CHECK constraint). */
    public static String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
