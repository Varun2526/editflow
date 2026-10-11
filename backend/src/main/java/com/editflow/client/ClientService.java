package com.editflow.client;

import com.editflow.client.dto.ClientCreatedResponse;
import com.editflow.client.dto.ClientDetailResponse;
import com.editflow.client.dto.ClientListItem;
import com.editflow.client.dto.ClientRequest;
import com.editflow.common.exception.ConflictException;
import com.editflow.common.exception.NotFoundException;
import com.editflow.common.util.Emails;
import com.editflow.common.util.Strings;
import com.editflow.project.CurrentProjectSelector;
import com.editflow.project.Project;
import com.editflow.project.ProjectMetrics;
import com.editflow.project.ProjectMetricsService;
import com.editflow.project.ProjectRepository;
import com.editflow.project.dto.ProjectResponse;
import com.editflow.user.PortalAccountService;
import com.editflow.user.UserRepository;
import com.editflow.user.dto.PortalCredentials;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Admin client management. Clients are never deleted (their projects and payments are history). */
@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMetricsService metricsService;
    private final PortalAccountService portalAccountService;

    public ClientService(ClientRepository clientRepository, ProjectRepository projectRepository,
                         UserRepository userRepository, ProjectMetricsService metricsService,
                         PortalAccountService portalAccountService) {
        this.clientRepository = clientRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.metricsService = metricsService;
        this.portalAccountService = portalAccountService;
    }

    @Transactional(readOnly = true)
    public List<ClientListItem> list() {
        List<Client> clients = clientRepository.findAllOrdered();
        if (clients.isEmpty()) {
            return List.of();
        }
        Map<Long, List<Project>> projectsByClient = projectRepository
                .findByClientIdsWithClient(clients.stream().map(Client::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(p -> p.getClient().getId()));
        Map<Long, Project> currentByClient = projectsByClient.entrySet().stream()
                .flatMap(e -> CurrentProjectSelector.select(e.getValue()).stream().map(p -> Map.entry(e.getKey(), p)))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        Map<Long, ProjectMetrics> metrics = metricsService.metricsFor(currentByClient.values());

        return clients.stream().map(client -> {
            Project current = currentByClient.get(client.getId());
            ProjectResponse currentProject = current == null ? null
                    : ProjectResponse.from(current, metrics.get(current.getId()));
            return new ClientListItem(client.getId(), client.getName(), client.getEmail(), client.getPhone(),
                    client.getCompanyName(), client.getUser() != null, currentProject);
        }).toList();
    }

    @Transactional(readOnly = true)
    public ClientDetailResponse get(Long id) {
        return toDetail(requireClient(id));
    }

    @Transactional
    public ClientCreatedResponse create(ClientRequest request) {
        String email = Emails.normalize(request.email());
        if (clientRepository.existsByEmail(email)) {
            throw new ConflictException("A client with email " + email + " already exists");
        }
        Client client = new Client(request.name().trim(), email);
        applyDetails(client, request);
        clientRepository.save(client);
        PortalCredentials credentials = Boolean.TRUE.equals(request.createPortalAccess())
                ? portalAccountService.createFor(client)
                : null;
        return new ClientCreatedResponse(toDetail(client), credentials);
    }

    @Transactional
    public ClientDetailResponse update(Long id, ClientRequest request) {
        Client client = requireClient(id);
        String email = Emails.normalize(request.email());
        if (!email.equals(client.getEmail())) {
            changeEmail(client, email);
        }
        client.setName(request.name().trim());
        applyDetails(client, request);
        return toDetail(client);
    }

    @Transactional
    public PortalCredentials createOrResetPortalAccess(Long id) {
        return portalAccountService.createOrReset(requireClient(id));
    }

    private void changeEmail(Client client, String email) {
        if (clientRepository.existsByEmailAndIdNot(email, client.getId())) {
            throw new ConflictException("A client with email " + email + " already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Another account already uses " + email);
        }
        client.setEmail(email);
        // The portal login follows the client's email.
        Optional.ofNullable(client.getUser()).ifPresent(user -> user.changeEmail(email));
    }

    private static void applyDetails(Client client, ClientRequest request) {
        client.setPhone(Strings.trimToNull(request.phone()));
        client.setInstagram(Strings.trimToNull(request.instagram()));
        client.setCompanyName(Strings.trimToNull(request.companyName()));
        client.setNotes(Strings.trimToNull(request.notes()));
    }

    private ClientDetailResponse toDetail(Client client) {
        List<Project> projects = client.getId() == null ? List.of()
                : projectRepository.findByClientIdWithClient(client.getId());
        Map<Long, ProjectMetrics> metrics = metricsService.metricsFor(projects);
        List<ProjectResponse> projectResponses = projects.stream()
                .map(p -> ProjectResponse.from(p, metrics.get(p.getId())))
                .toList();
        ProjectResponse current = CurrentProjectSelector.select(projects)
                .map(p -> ProjectResponse.from(p, metrics.get(p.getId())))
                .orElse(null);
        return new ClientDetailResponse(client.getId(), client.getName(), client.getEmail(), client.getPhone(),
                client.getInstagram(), client.getCompanyName(), client.getNotes(), client.getUser() != null,
                client.getCreatedAt(), current, projectResponses);
    }

    private Client requireClient(Long id) {
        return clientRepository.findById(id).orElseThrow(() -> NotFoundException.of("Client", id));
    }
}
