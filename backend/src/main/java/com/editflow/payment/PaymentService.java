package com.editflow.payment;

import com.editflow.common.exception.BusinessRuleException;
import com.editflow.common.exception.NotFoundException;
import com.editflow.common.util.Strings;
import com.editflow.payment.dto.PaymentRequest;
import com.editflow.payment.dto.PaymentResponse;
import com.editflow.payment.dto.PaymentsOverviewResponse;
import com.editflow.payment.dto.ProjectPaymentsResponse;
import com.editflow.payment.dto.RecentPaymentResponse;
import com.editflow.project.Project;
import com.editflow.project.ProjectMetrics;
import com.editflow.project.ProjectMetricsService;
import com.editflow.project.ProjectRepository;
import com.editflow.project.ProjectStatus;
import com.editflow.project.dto.ProjectResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Manually recorded UPI payments. Records are never edited; a mistaken entry is deleted. */
@Service
public class PaymentService {

    private static final Set<ProjectStatus> BILLABLE = EnumSet.of(ProjectStatus.ACTIVE, ProjectStatus.COMPLETED);

    private final PaymentRepository paymentRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMetricsService metricsService;
    private final Clock clock;

    public PaymentService(PaymentRepository paymentRepository, ProjectRepository projectRepository,
                          ProjectMetricsService metricsService, Clock clock) {
        this.paymentRepository = paymentRepository;
        this.projectRepository = projectRepository;
        this.metricsService = metricsService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ProjectPaymentsResponse listForProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> NotFoundException.of("Project", projectId));
        return paymentsOf(project);
    }

    /** Shared with the client portal (after its ownership check). */
    @Transactional(readOnly = true)
    public ProjectPaymentsResponse paymentsOf(Project project) {
        List<PaymentResponse> payments = paymentRepository.findByProjectIdOrdered(project.getId()).stream()
                .map(PaymentResponse::from)
                .toList();
        PaymentSummary summary = PaymentSummary.of(project.getTotalFee(),
                payments.stream().map(PaymentResponse::amount).reduce(BigDecimal.ZERO, BigDecimal::add));
        return new ProjectPaymentsResponse(project.getId(), summary, payments);
    }

    @Transactional
    public PaymentResponse record(Long projectId, PaymentRequest request) {
        // Row lock: concurrent payments for the same project are checked one at a time.
        Project project = projectRepository.findByIdForUpdate(projectId)
                .orElseThrow(() -> NotFoundException.of("Project", projectId));
        if (request.paymentDate().isAfter(LocalDate.now(clock))) {
            throw new BusinessRuleException("Payment date cannot be in the future");
        }
        BigDecimal balance = project.getTotalFee().subtract(paymentRepository.sumByProjectId(projectId));
        if (request.amount().compareTo(balance) > 0) {
            throw new BusinessRuleException("Payment of " + money(request.amount())
                    + " exceeds the remaining balance of " + money(balance));
        }
        Payment payment = new Payment(project, request.amount(), request.paymentDate(),
                Strings.trimToNull(request.note()));
        return PaymentResponse.from(paymentRepository.save(payment));
    }

    @Transactional
    public void delete(Long id) {
        Payment payment = paymentRepository.findById(id).orElseThrow(() -> NotFoundException.of("Payment", id));
        paymentRepository.delete(payment);
    }

    @Transactional(readOnly = true)
    public PaymentsOverviewResponse overview() {
        List<Project> projects = Stream.of(ProjectStatus.ACTIVE, ProjectStatus.COMPLETED)
                .flatMap(status -> projectRepository.findAllWithClient(status).stream())
                .toList();
        Map<Long, ProjectMetrics> metrics = metricsService.metricsFor(projects);
        List<ProjectResponse> rows = projects.stream()
                .map(p -> ProjectResponse.from(p, metrics.get(p.getId())))
                .toList();
        FinancialTotals totals = billableTotals();
        List<RecentPaymentResponse> recent = paymentRepository.findRecentWithProject().stream()
                .map(RecentPaymentResponse::from)
                .toList();
        return new PaymentsOverviewResponse(totals.totalFees(), totals.totalPaid(), totals.outstanding(), rows, recent);
    }

    /** Fees, payments and outstanding balance across ACTIVE and COMPLETED projects (archived excluded). */
    @Transactional(readOnly = true)
    public FinancialTotals billableTotals() {
        BigDecimal totalFees = projectRepository.sumFeesForStatuses(BILLABLE);
        BigDecimal totalPaid = paymentRepository.sumForProjectStatuses(BILLABLE);
        return new FinancialTotals(totalFees, totalPaid, totalFees.subtract(totalPaid));
    }

    private static String money(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
