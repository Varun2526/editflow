package com.editflow.project;

import java.util.Collection;
import java.util.Comparator;
import java.util.Optional;

/** A client's "current" project: the latest ACTIVE one by (year, month); otherwise the latest project. */
public final class CurrentProjectSelector {

    private static final Comparator<Project> BY_PERIOD =
            Comparator.comparing(Project::getPeriodYear).thenComparing(Project::getPeriodMonth);

    private CurrentProjectSelector() {
    }

    public static Optional<Project> select(Collection<Project> projects) {
        return projects.stream()
                .filter(p -> p.getStatus() == ProjectStatus.ACTIVE)
                .max(BY_PERIOD)
                .or(() -> projects.stream().max(BY_PERIOD));
    }
}
