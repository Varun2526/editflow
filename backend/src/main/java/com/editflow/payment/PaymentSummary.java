package com.editflow.payment;

import java.math.BigDecimal;

/**
 * Financial position of a project, always derived from payment records:
 * totalPaid = SUM(payments.amount), balance = totalFee - totalPaid.
 */
public record PaymentSummary(BigDecimal totalFee, BigDecimal totalPaid, BigDecimal balance, PaymentStatus status) {

    public static PaymentSummary of(BigDecimal totalFee, BigDecimal totalPaid) {
        BigDecimal paid = totalPaid == null ? BigDecimal.ZERO : totalPaid;
        return new PaymentSummary(totalFee, paid, totalFee.subtract(paid), statusFor(totalFee, paid));
    }

    static PaymentStatus statusFor(BigDecimal fee, BigDecimal paid) {
        if (fee.signum() == 0) {
            return PaymentStatus.PAID;
        }
        if (paid.signum() == 0) {
            return PaymentStatus.UNPAID;
        }
        return paid.compareTo(fee) < 0 ? PaymentStatus.PARTIALLY_PAID : PaymentStatus.PAID;
    }
}
