package com.editflow.revision.dto;

import com.editflow.common.validation.Timecodes;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RevisionRequest(
        @NotBlank @Pattern(regexp = Timecodes.PATTERN, message = Timecodes.MESSAGE) String timecode,
        @NotBlank @Size(max = 2000) String comment) {
}
