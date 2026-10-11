package com.editflow.support;

import com.editflow.client.Client;
import com.editflow.client.ClientRepository;
import com.editflow.payment.Payment;
import com.editflow.payment.PaymentRepository;
import com.editflow.project.Project;
import com.editflow.project.ProjectRepository;
import com.editflow.project.ProjectStatus;
import com.editflow.revision.RequestedBy;
import com.editflow.revision.Revision;
import com.editflow.revision.RevisionRepository;
import com.editflow.user.Role;
import com.editflow.user.User;
import com.editflow.user.UserRepository;
import com.editflow.video.ContentType;
import com.editflow.video.Video;
import com.editflow.video.VideoRepository;
import com.editflow.video.VideoStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Creates persisted fixtures for integration tests. */
@Component
public class TestData {

    public static final String PASSWORD = "Correct-Horse-42";

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final ProjectRepository projectRepository;
    private final VideoRepository videoRepository;
    private final RevisionRepository revisionRepository;
    private final PaymentRepository paymentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public TestData(UserRepository userRepository, ClientRepository clientRepository,
                    ProjectRepository projectRepository, VideoRepository videoRepository,
                    RevisionRepository revisionRepository, PaymentRepository paymentRepository,
                    PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.projectRepository = projectRepository;
        this.videoRepository = videoRepository;
        this.revisionRepository = revisionRepository;
        this.paymentRepository = paymentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public User admin(String email) {
        return userRepository.save(new User("Admin", email, passwordEncoder.encode(PASSWORD), Role.ADMIN, false));
    }

    @Transactional
    public Client clientWithLogin(String name, String email, boolean mustChangePassword) {
        User user = userRepository.save(
                new User(name, email, passwordEncoder.encode(PASSWORD), Role.CLIENT, mustChangePassword));
        Client client = new Client(name, email);
        client.setUser(user);
        return clientRepository.save(client);
    }

    @Transactional
    public Client clientWithoutLogin(String name, String email) {
        return clientRepository.save(new Client(name, email));
    }

    @Transactional
    public Project project(Client client, int month, int year, String fee) {
        return projectRepository.save(new Project(client, "Content " + month + "/" + year, month, year, new BigDecimal(fee)));
    }

    @Transactional
    public Project project(Client client, int month, int year, String fee, ProjectStatus status) {
        Project project = new Project(client, "Content " + month + "/" + year, month, year, new BigDecimal(fee));
        project.setStatus(status);
        return projectRepository.save(project);
    }

    @Transactional
    public Video video(Project project, String title, LocalDate deadline) {
        Video video = new Video(project, title, ContentType.REEL);
        video.setDeadline(deadline);
        return videoRepository.save(video);
    }

    /** Test setup shortcut: puts a video directly into a status, bypassing the workflow. */
    public Video video(Project project, String title, VideoStatus status, LocalDate deadline) {
        Video video = video(project, title, deadline);
        jdbcTemplate.update("update videos set status = ? where id = ?", status.name(), video.getId());
        return video;
    }

    @Transactional
    public Revision revision(Video video, String timecode, String comment) {
        return revisionRepository.save(new Revision(video, timecode, comment, RequestedBy.CLIENT));
    }

    @Transactional
    public Payment payment(Project project, String amount, LocalDate date) {
        return paymentRepository.save(new Payment(project, new BigDecimal(amount), date, null));
    }
}
