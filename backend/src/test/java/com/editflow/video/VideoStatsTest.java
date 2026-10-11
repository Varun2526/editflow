package com.editflow.video;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;

class VideoStatsTest {

    @Test
    void progressCountsCompletedAndDeliveredAsDone() {
        VideoStats stats = VideoStats.from(Map.of(
                VideoStatus.PENDING, 5L,
                VideoStatus.EDITING, 2L,
                VideoStatus.COMPLETED, 4L,
                VideoStatus.DELIVERED, 4L), 1);

        assertThat(stats.total()).isEqualTo(15);
        assertThat(stats.done()).isEqualTo(8);
        assertThat(stats.progressPercent()).isEqualByComparingTo("53.33");
        assertThat(stats.overdue()).isEqualTo(1);
    }

    @Test
    void everyStatusIsPresentEvenWhenZero() {
        VideoStats stats = VideoStats.from(Map.of(VideoStatus.REVIEW, 2L), 0);

        assertThat(stats.byStatus()).containsOnlyKeys(VideoStatus.values());
        assertThat(stats.byStatus().get(VideoStatus.PENDING)).isZero();
    }

    @Test
    void emptyProjectHasZeroProgress() {
        assertThat(VideoStats.EMPTY.total()).isZero();
        assertThat(VideoStats.EMPTY.progressPercent()).isEqualByComparingTo("0");
    }

    @Test
    void roundsHalfUpToTwoDecimals() {
        assertThat(VideoStats.progress(2, 3)).isEqualByComparingTo("66.67");
        assertThat(VideoStats.progress(1, 3)).isEqualByComparingTo("33.33");
    }
}
