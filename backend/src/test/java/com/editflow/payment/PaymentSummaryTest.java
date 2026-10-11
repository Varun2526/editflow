package com.editflow.payment;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class PaymentSummaryTest {

    @ParameterizedTest(name = "fee {0}, paid {1} -> balance {2}, {3}")
    @CsvSource({
            "25000.00, 0,        25000.00, UNPAID",
            "25000.00, 10000.00, 15000.00, PARTIALLY_PAID",
            "25000.00, 24999.99, 0.01,     PARTIALLY_PAID",
            "25000.00, 25000.00, 0.00,     PAID",
            "0.00,     0,        0.00,     PAID"})
    void derivesBalanceAndStatus(String fee, String paid, String balance, PaymentStatus status) {
        PaymentSummary summary = PaymentSummary.of(new BigDecimal(fee), new BigDecimal(paid));

        assertThat(summary.totalPaid()).isEqualByComparingTo(paid);
        assertThat(summary.balance()).isEqualByComparingTo(balance);
        assertThat(summary.status()).isEqualTo(status);
    }

    @Test
    void nullPaidMeansNothingPaid() {
        assertThat(PaymentSummary.of(new BigDecimal("25000.00"), null).status()).isEqualTo(PaymentStatus.UNPAID);
    }
}
