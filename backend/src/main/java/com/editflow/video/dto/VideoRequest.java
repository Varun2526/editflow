package com.editflow.video.dto;

import com.editflow.common.validation.HttpUrl;
import com.editflow.video.ContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** Editable video details. Status is deliberately absent: it changes only through the workflow endpoint. */
public record VideoRequest(
        @NotBlank @Size(max = 200) String title,
        @NotNull ContentType contentType,
        LocalDate deadline,
        @HttpUrl @Size(max = 2048) String driveUrl) {
}
