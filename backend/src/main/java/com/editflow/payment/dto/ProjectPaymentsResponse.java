package com.editflow.payment.dto;

import com.editflow.payment.PaymentSummary;
import java.util.List;

/** Installment history (newest first) plus the derived totals. Shared by admin and client portal. */
public record ProjectPaymentsResponse(Long projectId, PaymentSummary summary, List<PaymentResponse> payments) {
}
