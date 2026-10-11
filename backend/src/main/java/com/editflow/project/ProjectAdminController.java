package com.editflow.project;

import com.editflow.project.dto.ProjectRequest;
import com.editflow.project.dto.ProjectResponse;
import com.editflow.project.dto.ProjectStatusRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class ProjectAdminController {

    private final ProjectService projectService;

    public ProjectAdminController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/projects")
    public List<ProjectResponse> list(@RequestParam(required = false) ProjectStatus status) {
        return projectService.list(status);
    }

    @GetMapping("/projects/{id}")
    public ProjectResponse get(@PathVariable Long id) {
        return projectService.get(id);
    }

    @PutMapping("/projects/{id}")
    public ProjectResponse update(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
        return projectService.update(id, request);
    }

    @PatchMapping("/projects/{id}/status")
    public ProjectResponse changeStatus(@PathVariable Long id, @Valid @RequestBody ProjectStatusRequest request) {
        return projectService.changeStatus(id, request.status());
    }

    @GetMapping("/clients/{clientId}/projects")
    public List<ProjectResponse> listForClient(@PathVariable Long clientId) {
        return projectService.listForClient(clientId);
    }

    @PostMapping("/clients/{clientId}/projects")
    public ResponseEntity<ProjectResponse> create(@PathVariable Long clientId,
                                                  @Valid @RequestBody ProjectRequest request) {
        ProjectResponse created = projectService.create(clientId, request);
        return ResponseEntity.created(URI.create("/api/admin/projects/" + created.id())).body(created);
    }
}
