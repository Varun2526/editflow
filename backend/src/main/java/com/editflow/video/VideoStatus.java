package com.editflow.video;

/** Production status, in workflow order. Independent of {@link ContentType}. */
public enum VideoStatus {
    PENDING,
    MEDIA_RECEIVED,
    EDITING,
    REVIEW,
    COMPLETED,
    DELIVERED
}
