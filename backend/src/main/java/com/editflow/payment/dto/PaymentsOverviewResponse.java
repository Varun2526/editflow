package com.editflow.payment.dto;

import com.editflow.project.dto.ProjectResponse;
import java.math.BigDecimal;
import java.util.List;

/** Admin Payments page: ACTIVE and COMPLETED projects (archived excluded) and the latest payments. */
public record PaymentsOverviewResponse(
        BigDecimal totalFees,
        BigDecimal totalPaid,
        BigDecimal outstanding,
        List<ProjectResponse> projects,
        List<RecentPaymentResponse> recentPayments) {
}
