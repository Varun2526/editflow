package com.editflow.inquiry;

import com.editflow.common.exception.ConflictException;
import com.editflow.common.exception.NotFoundException;
import com.editflow.common.util.Strings;
import com.editflow.inquiry.dto.InquiryRequest;
import com.editflow.inquiry.dto.InquiryResponse;
import com.editflow.inquiry.dto.InquirySubmittedResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InquiryService {

    static final String SUBMITTED_MESSAGE = "Thanks! Your inquiry has been submitted.";

    private final InquiryRepository inquiryRepository;

    public InquiryService(InquiryRepository inquiryRepository) {
        this.inquiryRepository = inquiryRepository;
    }

    @Transactional
    public InquirySubmittedResponse submit(InquiryRequest request) {
        Inquiry inquiry = inquiryRepository.save(new Inquiry(
                request.name().trim(),
                request.email(),
                request.phoneOrInstagram().trim(),
                request.contentType().trim(),
                request.videosPerMonth(),
                request.budget(),
                request.deadline(),
                Strings.trimToNull(request.description())));
        return new InquirySubmittedResponse(inquiry.getId(), SUBMITTED_MESSAGE);
    }

    @Transactional(readOnly = true)
    public List<InquiryResponse> list(InquiryStatus status) {
        return inquiryRepository.findAllByStatus(status).stream().map(InquiryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public InquiryResponse get(Long id) {
        return InquiryResponse.from(requireInquiry(id));
    }

    @Transactional
    public InquiryResponse reject(Long id) {
        Inquiry inquiry = requireInquiry(id);
        requirePending(inquiry);
        inquiry.markRejected();
        // Flush now so a concurrent accept/reject surfaces as an optimistic-lock 409 here.
        return InquiryResponse.from(inquiryRepository.saveAndFlush(inquiry));
    }

    Inquiry requireInquiry(Long id) {
        return inquiryRepository.findById(id).orElseThrow(() -> NotFoundException.of("Inquiry", id));
    }

    static void requirePending(Inquiry inquiry) {
        if (inquiry.getStatus() != InquiryStatus.PENDING) {
            throw new ConflictException("Inquiry has already been " + inquiry.getStatus().name().toLowerCase());
        }
    }
}
