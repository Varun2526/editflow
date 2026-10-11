package com.editflow.inquiry.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** The admin confirms the project details when accepting (the inquiry only has an estimated budget). */
public record AcceptInquiryRequest(
        @NotBlank @Size(max = 150) String projectName,
        @Size(max = 5000) String description,
        @NotNull @Min(1) @Max(12) Integer month,
        @NotNull @Min(2000) @Max(2100) Integer year,
        @NotNull @PositiveOrZero @Digits(integer = 10, fraction = 2) BigDecimal totalFee) {
}
