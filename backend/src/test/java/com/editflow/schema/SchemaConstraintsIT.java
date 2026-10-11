package com.editflow.schema;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.editflow.client.Client;
import com.editflow.payment.Payment;
import com.editflow.payment.PaymentRepository;
import com.editflow.project.Project;
import com.editflow.project.ProjectRepository;
import com.editflow.revision.RequestedBy;
import com.editflow.revision.Revision;
import com.editflow.revision.RevisionRepository;
import com.editflow.support.IntegrationTest;
import com.editflow.video.ContentType;
import com.editflow.video.Video;
import com.editflow.video.VideoRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

/** The database itself rejects invalid data, as a backstop behind service-level validation. */
class SchemaConstraintsIT extends IntegrationTest {

    @Autowired
    ProjectRepository projectRepository;

    @Autowired
    VideoRepository videoRepository;

    @Autowired
    RevisionRepository revisionRepository;

    @Autowired
    PaymentRepository paymentRepository;

    private Client client;
    private Project project;

    @BeforeEach
    void setUp() {
        client = testData.clientWithoutLogin("Rahul Fitness", "rahul@fitness.test");
        project = projectRepository.saveAndFlush(
                new Project(client, "October 2026 Content", 10, 2026, new BigDecimal("25000.00")));
    }

    @Test
    void oneProjectPerClientPerMonth() {
        Project duplicate = new Project(client, "Duplicate", 10, 2026, BigDecimal.ZERO);

        assertThatThrownBy(() -> projectRepository.saveAndFlush(duplicate))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void paymentAmountMustBePositive() {
        Payment zero = new Payment(project, BigDecimal.ZERO, LocalDate.of(2026, 10, 1), null);

        assertThatThrownBy(() -> paymentRepository.saveAndFlush(zero))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void driveUrlMustBeHttpOrHttps() {
        Video video = new Video(project, "Morning Workout Reel", ContentType.REEL);
        video.setDriveUrl("ftp://drive.example.com/file");

        assertThatThrownBy(() -> videoRepository.saveAndFlush(video))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void revisionTimecodeMustBeMmSsOrHhMmSs() {
        Video video = videoRepository.saveAndFlush(new Video(project, "Nutrition Tips", ContentType.REEL));

        assertThatCode(() -> revisionRepository.saveAndFlush(
                new Revision(video, "00:17", "Make this transition faster", RequestedBy.CLIENT)))
                .doesNotThrowAnyException();
        assertThatCode(() -> revisionRepository.saveAndFlush(
                new Revision(video, "1:02:03", "Trim the intro", RequestedBy.CLIENT)))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> revisionRepository.saveAndFlush(
                new Revision(video, "0:75", "Bad timecode", RequestedBy.CLIENT)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
