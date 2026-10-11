package com.editflow.common.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * "Today" (due-today, overdue) must mean the editor's local date, not the server's UTC date.
 * Business code takes this Clock instead of calling now() directly, which also lets tests pin time.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock(AppProperties properties) {
        return Clock.system(properties.timezone());
    }
}
