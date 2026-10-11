package com.editflow.portal;

import com.editflow.payment.dto.ProjectPaymentsResponse;
import com.editflow.portal.dto.ClientDashboardResponse;
import com.editflow.portal.dto.ClientProfileResponse;
import com.editflow.portal.dto.ClientVideoDetailResponse;
import com.editflow.portal.dto.ClientVideoResponse;
import com.editflow.project.dto.ProjectResponse;
import com.editflow.revision.dto.RevisionRequest;
import com.editflow.revision.dto.RevisionResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Client portal for CLIENT users: read-only views, revision requests, and the client's explicit
 * approval of a video in review (the only status change a client can make, validated by the workflow).
 */
@RestController
@RequestMapping("/api/client/me")
public class ClientPortalController {

    private final ClientPortalService portalService;

    public ClientPortalController(ClientPortalService portalService) {
        this.portalService = portalService;
    }

    @GetMapping("/dashboard")
    public ClientDashboardResponse dashboard() {
        return portalService.dashboard();
    }

    @GetMapping("/profile")
    public ClientProfileResponse profile() {
        return portalService.profile();
    }

    @GetMapping("/projects")
    public List<ProjectResponse> projects() {
        return portalService.projects();
    }

    @GetMapping("/projects/{id}")
    public ProjectResponse project(@PathVariable Long id) {
        return portalService.project(id);
    }

    @GetMapping("/projects/{id}/videos")
    public List<ClientVideoResponse> projectVideos(@PathVariable Long id) {
        return portalService.projectVideos(id);
    }

    @GetMapping("/projects/{id}/payments")
    public ProjectPaymentsResponse projectPayments(@PathVariable Long id) {
        return portalService.projectPayments(id);
    }

    @GetMapping("/videos/{id}")
    public ClientVideoDetailResponse video(@PathVariable Long id) {
        return portalService.video(id);
    }

    @PostMapping("/videos/{id}/approve")
    public ClientVideoResponse approveVideo(@PathVariable Long id) {
        return portalService.approveVideo(id);
    }

    @PostMapping("/videos/{id}/revisions")
    @ResponseStatus(HttpStatus.CREATED)
    public RevisionResponse requestRevision(@PathVariable Long id, @Valid @RequestBody RevisionRequest request) {
        return portalService.requestRevision(id, request);
    }
}
