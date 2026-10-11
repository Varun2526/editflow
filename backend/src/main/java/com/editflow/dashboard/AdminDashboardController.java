package com.editflow.dashboard;

import com.editflow.dashboard.dto.DashboardSummaryResponse;
import com.editflow.dashboard.dto.DashboardTasksResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final DashboardService dashboardService;

    public AdminDashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse summary() {
        return dashboardService.summary();
    }

    @GetMapping("/tasks")
    public DashboardTasksResponse tasks() {
        return dashboardService.tasks();
    }
}
