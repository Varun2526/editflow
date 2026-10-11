package com.editflow.dashboard.dto;

import java.time.LocalDate;
import java.util.List;

/** "Today's Tasks" for videos in ACTIVE projects. today is in the app timezone (Asia/Kolkata by default). */
public record DashboardTasksResponse(
        LocalDate today,
        List<TaskVideo> dueToday,
        List<TaskVideo> overdue,
        List<TaskVideo> inEditing,
        List<TaskVideo> inReview,
        List<OpenRevisionItem> openRevisions) {
}
