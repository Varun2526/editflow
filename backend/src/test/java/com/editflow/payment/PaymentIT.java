package com.editflow.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItems;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.editflow.client.Client;
import com.editflow.project.Project;
import com.editflow.project.ProjectStatus;
import com.editflow.support.IntegrationTest;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

class PaymentIT extends IntegrationTest {

    @Autowired
    PaymentRepository paymentRepository;

    @Autowired
    Clock clock;

    private String admin;
    private Client client;
    private Project project;
    private LocalDate today;

    @BeforeEach
    void setUp() throws Exception {
        admin = adminToken();
        client = testData.clientWithoutLogin("Rahul Fitness", "rahul@fitness.test");
        project = testData.project(client, 10, 2026, "25000");
        today = LocalDate.now(clock);
    }

    @Test
    void recordingPaymentsUpdatesDerivedTotals() throws Exception {
        record("10000", today.minusDays(9), "UPI ref 4411").andExpect(status().isCreated())
                .andExpect(jsonPath("$.amount").value(10000))
                .andExpect(jsonPath("$.note").value("UPI ref 4411"));
        record("5000", today, null).andExpect(status().isCreated());

        mvc.perform(get("/api/admin/projects/" + project.getId() + "/payments").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.totalFee").value(25000))
                .andExpect(jsonPath("$.summary.totalPaid").value(15000))
                .andExpect(jsonPath("$.summary.balance").value(10000))
                .andExpect(jsonPath("$.summary.status").value("PARTIALLY_PAID"))
                .andExpect(jsonPath("$.payments.length()").value(2))
                .andExpect(jsonPath("$.payments[0].amount").value(5000)); // newest first
    }

    @Test
    void payingTheFullFeeMarksTheProjectPaid() throws Exception {
        record("25000", today, null).andExpect(status().isCreated());

        mvc.perform(get("/api/admin/projects/" + project.getId()).header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.payment.balance").value(0))
                .andExpect(jsonPath("$.payment.status").value("PAID"));
    }

    @Test
    void installmentsThatExactlyClearTheFeeAreAccepted() throws Exception {
        Project twentyK = testData.project(client, 11, 2026, "20000");

        recordFor(twentyK, "9000").andExpect(status().isCreated());
        mvc.perform(get("/api/admin/projects/" + twentyK.getId() + "/payments").header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.summary.totalPaid").value(9000))
                .andExpect(jsonPath("$.summary.balance").value(11000))
                .andExpect(jsonPath("$.summary.status").value("PARTIALLY_PAID"));

        // Exactly the remaining balance: must be accepted (only amounts ABOVE the balance are rejected).
        recordFor(twentyK, "11000").andExpect(status().isCreated());
        mvc.perform(get("/api/admin/projects/" + twentyK.getId() + "/payments").header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.summary.totalPaid").value(20000))
                .andExpect(jsonPath("$.summary.balance").value(0))
                .andExpect(jsonPath("$.summary.status").value("PAID"));
    }

    private ResultActions recordFor(Project target, String amount) throws Exception {
        return mvc.perform(post("/api/admin/projects/" + target.getId() + "/payments").header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON).content(json(paymentBody(amount, today, null))));
    }

    @Test
    void zeroOrNegativeAmountsAreRejected() throws Exception {
        record("0", today, null).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("amount"));
        record("-500", today, null).andExpect(status().isBadRequest());
        record("10.999", today, null).andExpect(status().isBadRequest());
        assertThat(paymentRepository.count()).isZero();
    }

    @Test
    void overpaymentIsRejected() throws Exception {
        record("20000", today, null).andExpect(status().isCreated());

        record("5000.01", today, null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Payment of 5000.01 exceeds the remaining balance of 5000.00"));
        record("5000", today, null).andExpect(status().isCreated());
        record("1", today, null).andExpect(status().isBadRequest());
    }

    @Test
    void concurrentPaymentsCannotTogetherExceedTheFee() throws Exception {
        String body = json(paymentBody("15000", today, null));
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Future<Integer>> results = new ArrayList<>();
        for (int i = 0; i < 2; i++) {
            results.add(pool.submit(() -> {
                start.await();
                return mvc.perform(post("/api/admin/projects/" + project.getId() + "/payments")
                                .header("Authorization", bearer(admin))
                                .contentType(MediaType.APPLICATION_JSON).content(body))
                        .andReturn().getResponse().getStatus();
            }));
        }
        start.countDown();
        List<Integer> statuses = new ArrayList<>();
        for (Future<Integer> result : results) {
            statuses.add(result.get());
        }
        pool.shutdown();

        assertThat(statuses).containsExactlyInAnyOrder(201, 400);
        assertThat(paymentRepository.count()).isEqualTo(1);
    }

    @Test
    void futurePaymentDatesAndMissingFieldsAreRejected() throws Exception {
        record("1000", today.plusDays(1), null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Payment date cannot be in the future"));
        mvc.perform(post("/api/admin/projects/" + project.getId() + "/payments").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItems("amount", "paymentDate")));
    }

    @Test
    void mistakenPaymentCanBeDeletedButNotEdited() throws Exception {
        String response = record("10000", today, null).andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(response).get("id").asLong();

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/admin/payments/" + id)
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(paymentBody("1", today, null))))
                .andExpect(status().isMethodNotAllowed());
        mvc.perform(delete("/api/admin/payments/" + id).header("Authorization", bearer(admin)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/admin/projects/" + project.getId() + "/payments").header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.summary.totalPaid").value(0))
                .andExpect(jsonPath("$.summary.status").value("UNPAID"));
    }

    @Test
    void overviewTotalsExcludeArchivedProjects() throws Exception {
        testData.payment(project, "10000", today);
        Project paidProject = testData.project(client, 9, 2026, "20000", ProjectStatus.COMPLETED);
        testData.payment(paidProject, "20000", today);
        Project archived = testData.project(client, 8, 2026, "50000", ProjectStatus.ARCHIVED);
        testData.payment(archived, "1000", today);

        mvc.perform(get("/api/admin/payments").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalFees").value(45000))
                .andExpect(jsonPath("$.totalPaid").value(30000))
                .andExpect(jsonPath("$.outstanding").value(15000))
                .andExpect(jsonPath("$.projects.length()").value(2))
                .andExpect(jsonPath("$.recentPayments.length()").value(3))
                .andExpect(jsonPath("$.recentPayments[0].clientName").value("Rahul Fitness"));
    }

    private ResultActions record(String amount, LocalDate date, String note) throws Exception {
        return mvc.perform(post("/api/admin/projects/" + project.getId() + "/payments").header("Authorization", bearer(admin))
                .contentType(MediaType.APPLICATION_JSON).content(json(paymentBody(amount, date, note))));
    }

    private static Map<String, Object> paymentBody(String amount, LocalDate date, String note) {
        Map<String, Object> body = new HashMap<>();
        body.put("amount", new java.math.BigDecimal(amount));
        body.put("paymentDate", date.toString());
        body.put("note", note);
        return body;
    }
}
