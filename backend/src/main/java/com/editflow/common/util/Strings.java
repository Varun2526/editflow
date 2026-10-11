package com.editflow.common.util;

public final class Strings {

    private Strings() {
    }

    /** Trims, and turns blank optional input into null so "" and null mean the same thing. */
    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
