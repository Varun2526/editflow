package com.editflow.client;

import com.editflow.client.dto.ClientCreatedResponse;
import com.editflow.client.dto.ClientDetailResponse;
import com.editflow.client.dto.ClientListItem;
import com.editflow.client.dto.ClientRequest;
import com.editflow.user.dto.PortalCredentials;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/clients")
public class ClientAdminController {

    private final ClientService clientService;

    public ClientAdminController(ClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    public List<ClientListItem> list() {
        return clientService.list();
    }

    @GetMapping("/{id}")
    public ClientDetailResponse get(@PathVariable Long id) {
        return clientService.get(id);
    }

    @PostMapping
    public ResponseEntity<ClientCreatedResponse> create(@Valid @RequestBody ClientRequest request) {
        ClientCreatedResponse created = clientService.create(request);
        return ResponseEntity.created(URI.create("/api/admin/clients/" + created.client().id())).body(created);
    }

    @PutMapping("/{id}")
    public ClientDetailResponse update(@PathVariable Long id, @Valid @RequestBody ClientRequest request) {
        return clientService.update(id, request);
    }

    /** Creates a portal login, or issues a new temporary password if one exists. */
    @PostMapping("/{id}/portal-access")
    public PortalCredentials portalAccess(@PathVariable Long id) {
        return clientService.createOrResetPortalAccess(id);
    }
}
