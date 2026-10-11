package com.editflow.video.dto;

import com.editflow.video.VideoStatus;
import jakarta.validation.constraints.NotNull;

public record VideoStatusRequest(@NotNull VideoStatus status) {
}
