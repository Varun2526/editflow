package com.editflow.revision;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

/** Revision counts per video, derived from revision records (never stored on the video). */
public record RevisionCounts(long total, long open) {

    public static final RevisionCounts NONE = new RevisionCounts(0, 0);

    public static Map<Long, RevisionCounts> byVideo(RevisionRepository repository, Collection<Long> videoIds) {
        Map<Long, RevisionCounts> counts = new HashMap<>();
        if (videoIds.isEmpty()) {
            return counts;
        }
        for (RevisionRepository.VideoRevisionCount row : repository.countByVideoIds(videoIds)) {
            counts.put(row.getVideoId(), new RevisionCounts(row.getTotal(), row.getOpen()));
        }
        return counts;
    }
}
