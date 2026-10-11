package com.editflow.video;

import com.editflow.common.entity.AuditedEntity;
import com.editflow.project.Project;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "videos")
public class Video extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 20)
    private ContentType contentType;

    /** Changed only through {@link VideoWorkflow}, never by a plain setter. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VideoStatus status;

    private LocalDate deadline;

    @Column(name = "drive_url", length = 2048)
    private String driveUrl;

    @Column(name = "media_received_at")
    private Instant mediaReceivedAt;

    @Column(name = "edit_completed_at")
    private Instant editCompletedAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    /** Set only when the client approves the video in their portal. */
    @Column(name = "approved_at")
    private Instant approvedAt;

    protected Video() {
    }

    public Video(Project project, String title, ContentType contentType) {
        this.project = project;
        this.title = title;
        this.contentType = contentType;
        this.status = VideoStatus.PENDING;
    }

    /**
     * Applies a status change and keeps the stage timestamps consistent with it. Package-private:
     * only {@link VideoWorkflow} may call this, after validating the transition.
     *
     * <p>Entering MEDIA_RECEIVED / COMPLETED / DELIVERED (forward) stamps that stage. Any move to an
     * earlier status clears the timestamps of stages the video is no longer past.
     */
    void transitionTo(VideoStatus target, Instant now) {
        if (target.compareTo(status) > 0) {
            switch (target) {
                case MEDIA_RECEIVED -> mediaReceivedAt = now;
                case COMPLETED -> editCompletedAt = now;
                case DELIVERED -> deliveredAt = now;
                default -> { }
            }
        }
        if (target.compareTo(VideoStatus.MEDIA_RECEIVED) < 0) {
            mediaReceivedAt = null;
        }
        if (target.compareTo(VideoStatus.COMPLETED) < 0) {
            editCompletedAt = null;
            approvedAt = null;
        }
        if (target.compareTo(VideoStatus.DELIVERED) < 0) {
            deliveredAt = null;
        }
        status = target;
    }

    /** Client approval: completes the video and records who signed it off. Package-private (workflow only). */
    void approveAt(Instant now) {
        transitionTo(VideoStatus.COMPLETED, now);
        approvedAt = now;
    }

    public Long getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public ContentType getContentType() {
        return contentType;
    }

    public void setContentType(ContentType contentType) {
        this.contentType = contentType;
    }

    public VideoStatus getStatus() {
        return status;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }

    public String getDriveUrl() {
        return driveUrl;
    }

    public void setDriveUrl(String driveUrl) {
        this.driveUrl = driveUrl;
    }

    public Instant getMediaReceivedAt() {
        return mediaReceivedAt;
    }

    public Instant getEditCompletedAt() {
        return editCompletedAt;
    }

    public Instant getDeliveredAt() {
        return deliveredAt;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }
}
