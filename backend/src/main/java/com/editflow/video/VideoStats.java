package com.editflow.video;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.EnumMap;
import java.util.Map;

/**
 * Video counts for a project (or a set of projects), derived from video records.
 *
 * <p>Progress rule: a video counts as done when it is COMPLETED or DELIVERED.
 * progressPercent = done * 100 / total, rounded half-up to 2 decimals; 0 when there are no videos.
 * Example: 8 done of 15 = 53.33.
 */
public record VideoStats(long total, Map<VideoStatus, Long> byStatus, long done, BigDecimal progressPercent,
                         long overdue) {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    public static final VideoStats EMPTY = from(Map.of(), 0);

    public static VideoStats from(Map<VideoStatus, Long> counts, long overdue) {
        EnumMap<VideoStatus, Long> byStatus = new EnumMap<>(VideoStatus.class);
        for (VideoStatus status : VideoStatus.values()) {
            byStatus.put(status, counts.getOrDefault(status, 0L));
        }
        long total = byStatus.values().stream().mapToLong(Long::longValue).sum();
        long done = byStatus.get(VideoStatus.COMPLETED) + byStatus.get(VideoStatus.DELIVERED);
        return new VideoStats(total, Collections.unmodifiableMap(byStatus), done, progress(done, total), overdue);
    }

    static BigDecimal progress(long done, long total) {
        if (total == 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return BigDecimal.valueOf(done).multiply(HUNDRED).divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }
}
