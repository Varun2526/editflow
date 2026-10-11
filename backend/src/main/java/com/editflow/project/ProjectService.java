package com.editflow.project;

import com.editflow.client.Client;
import com.editflow.client.ClientRepository;
import com.editflow.common.exception.BusinessRuleException;
import com.editflow.common.exception.ConflictException;
import com.editflow.common.exception.NotFoundException;
import com.editflow.common.util.Strings;
import com.editflow.payment.PaymentRepository;
import com.editflow.project.dto.ProjectRequest;
import com.editflow.project.dto.ProjectResponse;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;
    private final PaymentRepository paymentRepository;
    private final ProjectMetricsService metricsService;

    public ProjectService(ProjectRepository projectRepository, ClientRepository clientRepository,
                          PaymentRepository paymentRepository, ProjectMetricsService metricsService) {
        this.projectRepository = projectRepository;
        this.clientRepository = clientRepository;
        this.paymentRepository = paymentRepository;
        this.metricsService = metricsService;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> list(ProjectStatus status) {
        return toResponses(projectRepository.findAllWithClient(status));
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listForClient(Long clientId) {
        requireClient(clientId);
        return toResponses(projectRepository.findByClientIdWithClient(clientId));
    }

    @Transactional(readOnly = true)
    public ProjectResponse get(Long id) {
        Project project = projectRepository.findWithClientById(id)
                .orElseThrow(() -> NotFoundException.of("Project", id));
        return ProjectResponse.from(project, metricsService.metricsFor(project));
    }

    @Transactional
    public ProjectResponse create(Long clientId, ProjectRequest request) {
        Client client = requireClient(clientId);
        Project project = createForClient(client, request.name(), request.description(),
                request.month(), request.year(), request.totalFee());
        return ProjectResponse.from(project, metricsService.metricsFor(project));
    }

    /** Shared by manual creation and inquiry acceptance so the one-project-per-month rule lives in one place. */
    @Transactional
    public Project createForClient(Client client, String name, String description, int month, int year,
                                   BigDecimal totalFee) {
        if (client.getId() != null
                && projectRepository.existsByClientIdAndPeriodMonthAndPeriodYear(client.getId(), month, year)) {
            throw duplicatePeriod(client, month, year);
        }
        Project project = new Project(client, name.trim(), month, year, totalFee);
        project.setDescription(Strings.trimToNull(description));
        return projectRepository.save(project);
    }

    @Transactional
    public ProjectResponse update(Long id, ProjectRequest request) {
        // Locked so a concurrent payment can't slip in between the fee check and the update.
        Project project = projectRepository.findByIdForUpdate(id)
                .orElseThrow(() -> NotFoundException.of("Project", id));
        Client client = project.getClient();
        if (projectRepository.existsByClientIdAndPeriodMonthAndPeriodYearAndIdNot(
                client.getId(), request.month(), request.year(), id)) {
            throw duplicatePeriod(client, request.month(), request.year());
        }
        BigDecimal paid = paymentRepository.sumByProjectId(id);
        if (request.totalFee().compareTo(paid) < 0) {
            throw new BusinessRuleException("Project fee cannot be lower than the amount already paid (" + paid + ")");
        }
        project.setName(request.name().trim());
        project.setDescription(Strings.trimToNull(request.description()));
        project.setPeriodMonth(request.month());
        project.setPeriodYear(request.year());
        project.setTotalFee(request.totalFee());
        return ProjectResponse.from(project, metricsService.metricsFor(project));
    }

    @Transactional
    public ProjectResponse changeStatus(Long id, ProjectStatus status) {
        Project project = projectRepository.findWithClientById(id)
                .orElseThrow(() -> NotFoundException.of("Project", id));
        project.setStatus(status);
        return ProjectResponse.from(project, metricsService.metricsFor(project));
    }

    private List<ProjectResponse> toResponses(List<Project> projects) {
        Map<Long, ProjectMetrics> metrics = metricsService.metricsFor(projects);
        return projects.stream().map(p -> ProjectResponse.from(p, metrics.get(p.getId()))).toList();
    }

    private Client requireClient(Long clientId) {
        return clientRepository.findById(clientId).orElseThrow(() -> NotFoundException.of("Client", clientId));
    }

    private static ConflictException duplicatePeriod(Client client, int month, int year) {
        return new ConflictException(client.getName() + " already has a project for " + month + "/" + year);
    }
}
