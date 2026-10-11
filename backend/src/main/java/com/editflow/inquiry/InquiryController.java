package com.editflow.inquiry;

import com.editflow.inquiry.dto.AcceptInquiryRequest;
import com.editflow.inquiry.dto.AcceptInquiryResponse;
import com.editflow.inquiry.dto.InquiryRequest;
import com.editflow.inquiry.dto.InquiryResponse;
import com.editflow.inquiry.dto.InquirySubmittedResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class InquiryController {

    private final InquiryService inquiryService;
    private final InquiryAcceptanceService acceptanceService;

    public InquiryController(InquiryService inquiryService, InquiryAcceptanceService acceptanceService) {
        this.inquiryService = inquiryService;
        this.acceptanceService = acceptanceService;
    }

    @PostMapping("/api/public/inquiries")
    @ResponseStatus(HttpStatus.CREATED)
    public InquirySubmittedResponse submit(@Valid @RequestBody InquiryRequest request) {
        return inquiryService.submit(request);
    }

    @GetMapping("/api/admin/inquiries")
    public List<InquiryResponse> list(@RequestParam(required = false) InquiryStatus status) {
        return inquiryService.list(status);
    }

    @GetMapping("/api/admin/inquiries/{id}")
    public InquiryResponse get(@PathVariable Long id) {
        return inquiryService.get(id);
    }

    @PostMapping("/api/admin/inquiries/{id}/accept")
    @ResponseStatus(HttpStatus.CREATED)
    public AcceptInquiryResponse accept(@PathVariable Long id, @Valid @RequestBody AcceptInquiryRequest request) {
        return acceptanceService.accept(id, request);
    }

    @PostMapping("/api/admin/inquiries/{id}/reject")
    public InquiryResponse reject(@PathVariable Long id) {
        return inquiryService.reject(id);
    }
}
