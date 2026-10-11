package com.editflow.payment.dto;

import com.editflow.payment.Payment;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record PaymentResponse(Long id, Long projectId, BigDecimal amount, LocalDate paymentDate, String note,
                              Instant createdAt) {

    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(payment.getId(), payment.getProject().getId(), payment.getAmount(),
                payment.getPaymentDate(), payment.getNote(), payment.getCreatedAt());
    }
}
