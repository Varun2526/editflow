package com.editflow.payment;

import java.math.BigDecimal;

public record FinancialTotals(BigDecimal totalFees, BigDecimal totalPaid, BigDecimal outstanding) {
}
