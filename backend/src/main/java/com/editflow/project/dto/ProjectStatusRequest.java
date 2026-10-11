package com.editflow.project.dto;

import com.editflow.project.ProjectStatus;
import jakarta.validation.constraints.NotNull;

public record ProjectStatusRequest(@NotNull ProjectStatus status) {
}
