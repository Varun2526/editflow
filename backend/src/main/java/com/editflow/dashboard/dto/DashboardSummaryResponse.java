package com.editflow.dashboard.dto;

import com.editflow.video.VideoStats;
import java.math.BigDecimal;

/**
 * Admin overview cards, all derived on request.
 *
 * @param videos video counts/progress/overdue across ACTIVE projects (the current workload)
 * @param totalFees fees of ACTIVE + COMPLETED projects; totalPaid and outstanding use the same scope
 */
public record DashboardSummaryResponse(
        long totalClients,
        long activeProjects,
        long pendingInquiries,
        long openRevisions,
        VideoStats videos,
        BigDecimal totalFees,
        BigDecimal totalPaid,
        BigDecimal outstanding) {
}
