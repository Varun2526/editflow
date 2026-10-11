package com.editflow.inquiry.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Public "Work With Me" form. */
public record InquiryRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(max = 100) String phoneOrInstagram,
        @NotBlank @Size(max = 120) String contentType,
        @NotNull @Min(1) @Max(500) Integer videosPerMonth,
        @NotNull @PositiveOrZero @Digits(integer = 10, fraction = 2) BigDecimal budget,
        LocalDate deadline,
        @Size(max = 2000) String description) {
}
