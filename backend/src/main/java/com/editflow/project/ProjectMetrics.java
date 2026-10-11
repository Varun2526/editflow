package com.editflow.project;

import com.editflow.payment.PaymentSummary;
import com.editflow.video.VideoStats;

public record ProjectMetrics(VideoStats videos, PaymentSummary payment) {
}
