package com.editflow.project;

import static org.assertj.core.api.Assertions.assertThat;

import com.editflow.client.Client;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class CurrentProjectSelectorTest {

    private final Client client = new Client("Rahul Fitness", "rahul@fitness.test");

    @Test
    void latestActiveProjectWinsOverNewerInactiveOnes() {
        Project septemberActive = project(9, 2026, ProjectStatus.ACTIVE);
        Project octoberActive = project(10, 2026, ProjectStatus.ACTIVE);
        Project novemberArchived = project(11, 2026, ProjectStatus.ARCHIVED);

        assertThat(CurrentProjectSelector.select(List.of(septemberActive, novemberArchived, octoberActive)))
                .contains(octoberActive);
    }

    @Test
    void yearOutranksMonth() {
        Project december2025 = project(12, 2025, ProjectStatus.ACTIVE);
        Project january2026 = project(1, 2026, ProjectStatus.ACTIVE);

        assertThat(CurrentProjectSelector.select(List.of(december2025, january2026))).contains(january2026);
    }

    @Test
    void withoutActiveProjectsTheMostRecentIsUsed() {
        Project completed = project(9, 2026, ProjectStatus.COMPLETED);
        Project archived = project(10, 2026, ProjectStatus.ARCHIVED);

        assertThat(CurrentProjectSelector.select(List.of(completed, archived))).contains(archived);
    }

    @Test
    void noProjectsMeansNoCurrentProject() {
        assertThat(CurrentProjectSelector.select(List.of())).isEmpty();
    }

    private Project project(int month, int year, ProjectStatus status) {
        Project project = new Project(client, "P", month, year, BigDecimal.ZERO);
        project.setStatus(status);
        return project;
    }
}
