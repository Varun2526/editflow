package com.editflow.revision;

import com.editflow.revision.dto.RevisionListItem;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class RevisionAdminController {

    private final RevisionService revisionService;

    public RevisionAdminController(RevisionService revisionService) {
        this.revisionService = revisionService;
    }

    @GetMapping("/revisions")
    public List<RevisionListItem> listAll(@RequestParam(required = false) RevisionStatus status) {
        return revisionService.listAll(status);
    }

    @GetMapping("/videos/{videoId}/revisions")
    public List<RevisionResponse> list(@PathVariable Long videoId) {
        return revisionService.listForVideo(videoId);
    }

    @PostMapping("/videos/{videoId}/revisions")
    @ResponseStatus(HttpStatus.CREATED)
    public RevisionResponse create(@PathVariable Long videoId, @Valid @RequestBody RevisionRequest request) {
        return revisionService.createByAdmin(videoId, request);
    }

    @PostMapping("/revisions/{id}/resolve")
    public RevisionResponse resolve(@PathVariable Long id) {
        return revisionService.resolve(id);
    }
}
