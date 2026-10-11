package com.editflow.video;

import com.editflow.video.dto.VideoDetailResponse;
import com.editflow.video.dto.VideoListItem;
import com.editflow.video.dto.VideoRequest;
import com.editflow.video.dto.VideoResponse;
import com.editflow.video.dto.VideoStatusRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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
public class VideoAdminController {

    private final VideoService videoService;

    public VideoAdminController(VideoService videoService) {
        this.videoService = videoService;
    }

    @GetMapping("/videos")
    public List<VideoListItem> listAll(@RequestParam(required = false) VideoStatus status) {
        return videoService.listAll(status);
    }

    @GetMapping("/projects/{projectId}/videos")
    public List<VideoResponse> list(@PathVariable Long projectId) {
        return videoService.listForProject(projectId);
    }

    @PostMapping("/projects/{projectId}/videos")
    public ResponseEntity<VideoResponse> create(@PathVariable Long projectId, @Valid @RequestBody VideoRequest request) {
        VideoResponse created = videoService.create(projectId, request);
        return ResponseEntity.created(URI.create("/api/admin/videos/" + created.id())).body(created);
    }

    @GetMapping("/videos/{id}")
    public VideoDetailResponse get(@PathVariable Long id) {
        return videoService.get(id);
    }

    @PutMapping("/videos/{id}")
    public VideoResponse update(@PathVariable Long id, @Valid @RequestBody VideoRequest request) {
        return videoService.update(id, request);
    }

    @PatchMapping("/videos/{id}/status")
    public VideoResponse changeStatus(@PathVariable Long id, @Valid @RequestBody VideoStatusRequest request) {
        return videoService.changeStatus(id, request.status());
    }

    @DeleteMapping("/videos/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        videoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
