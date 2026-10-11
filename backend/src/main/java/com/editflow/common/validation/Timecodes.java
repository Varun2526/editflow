package com.editflow.common.validation;

public final class Timecodes {

    /** "mm:ss" or "hh:mm:ss" (hours 1-2 digits). Mirrors the ck_revisions_timecode DB constraint. */
    public static final String PATTERN = "^([0-9]{1,2}:)?[0-5][0-9]:[0-5][0-9]$";
    public static final String MESSAGE = "must be in mm:ss or hh:mm:ss format";

    private Timecodes() {
    }
}
