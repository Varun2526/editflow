package com.editflow.payment.dto;

import com.editflow.payment.Payment;
import java.math.BigDecimal;
import java.time.LocalDate;

public record RecentPaymentResponse(Long id, Long projectId, String projectName, Long clientId, String clientName,
                                    BigDecimal amount, LocalDate paymentDate, String note) {

    /** Requires project and client to be fetched. */
    public static RecentPaymentResponse from(Payment payment) {
        return new RecentPaymentResponse(payment.getId(), payment.getProject().getId(), payment.getProject().getName(),
                payment.getProject().getClient().getId(), payment.getProject().getClient().getName(),
                payment.getAmount(), payment.getPaymentDate(), payment.getNote());
    }
}
