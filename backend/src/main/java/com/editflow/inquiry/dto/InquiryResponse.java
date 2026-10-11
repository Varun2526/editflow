package com.editflow.inquiry.dto;

import com.editflow.inquiry.Inquiry;
import com.editflow.inquiry.InquiryStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record InquiryResponse(
        Long id,
        String name,
        String email,
        String phoneOrInstagram,
        String contentType,
        int videosPerMonth,
        BigDecimal budget,
        LocalDate deadline,
        String description,
        InquiryStatus status,
        Long clientId,
        Long projectId,
        Instant createdAt,
        Instant updatedAt) {

    public static InquiryResponse from(Inquiry inquiry) {
        return new InquiryResponse(
                inquiry.getId(),
                inquiry.getName(),
                inquiry.getEmail(),
                inquiry.getPhoneOrInstagram(),
                inquiry.getContentType(),
                inquiry.getVideosPerMonth(),
                inquiry.getBudget(),
                inquiry.getDeadline(),
                inquiry.getDescription(),
                inquiry.getStatus(),
                inquiry.getClient() == null ? null : inquiry.getClient().getId(),
                inquiry.getProject() == null ? null : inquiry.getProject().getId(),
                inquiry.getCreatedAt(),
                inquiry.getUpdatedAt());
    }
}
