package com.editflow.inquiry;

import com.editflow.client.Client;
import com.editflow.client.ClientRepository;
import com.editflow.common.exception.ConflictException;
import com.editflow.inquiry.dto.AcceptInquiryRequest;
import com.editflow.inquiry.dto.AcceptInquiryResponse;
import com.editflow.inquiry.dto.InquiryResponse;
import com.editflow.project.Project;
import com.editflow.project.ProjectService;
import com.editflow.user.PortalAccountService;
import com.editflow.user.UserRepository;
import com.editflow.user.dto.PortalCredentials;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Inquiry -> Client (+ portal login) -> Project, as one transaction.
 *
 * <p>Double acceptance is prevented three ways: the PENDING check (sequential retries), the
 * inquiry's @Version (concurrent requests: the second flush fails and everything rolls back),
 * and the unique constraints on client email / project period as a final backstop.
 */
@Service
public class InquiryAcceptanceService {

    private static final Pattern PHONE = Pattern.compile("^\\+?[0-9][0-9 ()-]{6,}$");

    private final InquiryService inquiryService;
    private final InquiryRepository inquiryRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;
    private final PortalAccountService portalAccountService;

    public InquiryAcceptanceService(InquiryService inquiryService, InquiryRepository inquiryRepository,
                                    ClientRepository clientRepository, UserRepository userRepository,
                                    ProjectService projectService, PortalAccountService portalAccountService) {
        this.inquiryService = inquiryService;
        this.inquiryRepository = inquiryRepository;
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
        this.projectService = projectService;
        this.portalAccountService = portalAccountService;
    }

    @Transactional
    public AcceptInquiryResponse accept(Long inquiryId, AcceptInquiryRequest request) {
        Inquiry inquiry = inquiryService.requireInquiry(inquiryId);
        InquiryService.requirePending(inquiry);

        Optional<Client> existing = clientRepository.findByEmail(inquiry.getEmail());
        Client client = existing.orElseGet(() -> clientRepository.save(newClientFrom(inquiry)));

        Project project = projectService.createForClient(client, request.projectName(), request.description(),
                request.month(), request.year(), request.totalFee());

        PortalCredentials credentials = client.getUser() == null ? portalAccountService.createFor(client) : null;

        inquiry.markAccepted(client, project);
        inquiryRepository.saveAndFlush(inquiry);

        return new AcceptInquiryResponse(InquiryResponse.from(inquiry), client.getId(), project.getId(),
                existing.isEmpty(), credentials);
    }

    private Client newClientFrom(Inquiry inquiry) {
        if (userRepository.existsByEmail(inquiry.getEmail())) {
            // e.g. the admin's own email: never attach a client profile to a non-client account.
            throw new ConflictException("Another account already uses " + inquiry.getEmail());
        }
        Client client = new Client(inquiry.getName(), inquiry.getEmail());
        String contact = inquiry.getPhoneOrInstagram();
        if (PHONE.matcher(contact).matches()) {
            client.setPhone(contact);
        } else {
            client.setInstagram(contact.length() > 60 ? contact.substring(0, 60) : contact);
        }
        return client;
    }
}
