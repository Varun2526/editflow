package com.editflow.video;

import java.time.LocalDate;

public final class VideoDeadlines {

    private VideoDeadlines() {
    }

    /**
     * Overdue = deadline &lt; today AND status != DELIVERED. A COMPLETED-but-undelivered video past
     * its deadline is overdue on purpose: the client doesn't have it yet. The repository queries
     * for overdue lists/counts apply the same rule in JPQL.
     */
    public static boolean isOverdue(LocalDate deadline, VideoStatus status, LocalDate today) {
        return deadline != null && deadline.isBefore(today) && status != VideoStatus.DELIVERED;
    }
}
