package com.editflow.revision;

import com.editflow.video.Video;
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
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "revisions")
public class Revision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "video_id", nullable = false)
    private Video video;

    /** Position in the video, "mm:ss" or "hh:mm:ss". */
    @Column(nullable = false, length = 8)
    private String timecode;

    @Column(nullable = false, columnDefinition = "text")
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RevisionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "requested_by", nullable = false, length = 20)
    private RequestedBy requestedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    protected Revision() {
    }

    public Revision(Video video, String timecode, String comment, RequestedBy requestedBy) {
        this.video = video;
        this.timecode = timecode;
        this.comment = comment;
        this.requestedBy = requestedBy;
        this.status = RevisionStatus.OPEN;
    }

    public void resolve(Instant now) {
        this.status = RevisionStatus.RESOLVED;
        this.resolvedAt = now;
    }

    public Long getId() {
        return id;
    }

    public Video getVideo() {
        return video;
    }

    public String getTimecode() {
        return timecode;
    }

    public String getComment() {
        return comment;
    }

    public RevisionStatus getStatus() {
        return status;
    }

    public RequestedBy getRequestedBy() {
        return requestedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }
}
