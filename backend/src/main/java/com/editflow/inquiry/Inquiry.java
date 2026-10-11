package com.editflow.inquiry;

import com.editflow.client.Client;
import com.editflow.common.entity.AuditedEntity;
import com.editflow.common.util.Emails;
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
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "inquiries")
public class Inquiry extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(name = "phone_or_instagram", nullable = false, length = 100)
    private String phoneOrInstagram;

    /** Free text from the public form, e.g. "Reels + YouTube"; not the Video ContentType enum. */
    @Column(name = "content_type", nullable = false, length = 120)
    private String contentType;

    @Column(name = "videos_per_month", nullable = false)
    private Integer videosPerMonth;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal budget;

    private LocalDate deadline;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InquiryStatus status;

    /** What an acceptance created; null unless ACCEPTED. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    /** Optimistic lock: a concurrent second accept/reject fails instead of double-processing. */
    @Version
    @Column(nullable = false)
    private Long version;

    protected Inquiry() {
    }

    public Inquiry(String name, String email, String phoneOrInstagram, String contentType,
                   int videosPerMonth, BigDecimal budget, LocalDate deadline, String description) {
        this.name = name;
        this.email = Emails.normalize(email);
        this.phoneOrInstagram = phoneOrInstagram;
        this.contentType = contentType;
        this.videosPerMonth = videosPerMonth;
        this.budget = budget;
        this.deadline = deadline;
        this.description = description;
        this.status = InquiryStatus.PENDING;
    }

    public void markAccepted(Client client, Project project) {
        this.status = InquiryStatus.ACCEPTED;
        this.client = client;
        this.project = project;
    }

    public void markRejected() {
        this.status = InquiryStatus.REJECTED;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPhoneOrInstagram() {
        return phoneOrInstagram;
    }

    public String getContentType() {
        return contentType;
    }

    public Integer getVideosPerMonth() {
        return videosPerMonth;
    }

    public BigDecimal getBudget() {
        return budget;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public String getDescription() {
        return description;
    }

    public InquiryStatus getStatus() {
        return status;
    }

    public Client getClient() {
        return client;
    }

    public Project getProject() {
        return project;
    }

    public Long getVersion() {
        return version;
    }
}
