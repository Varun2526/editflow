package com.editflow.payment;

import com.editflow.payment.dto.PaymentRequest;
import com.editflow.payment.dto.PaymentResponse;
import com.editflow.payment.dto.PaymentsOverviewResponse;
import com.editflow.payment.dto.ProjectPaymentsResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class PaymentAdminController {

    private final PaymentService paymentService;

    public PaymentAdminController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/payments")
    public PaymentsOverviewResponse overview() {
        return paymentService.overview();
    }

    @GetMapping("/projects/{projectId}/payments")
    public ProjectPaymentsResponse list(@PathVariable Long projectId) {
        return paymentService.listForProject(projectId);
    }

    @PostMapping("/projects/{projectId}/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse record(@PathVariable Long projectId, @Valid @RequestBody PaymentRequest request) {
        return paymentService.record(projectId, request);
    }

    @DeleteMapping("/payments/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        paymentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
