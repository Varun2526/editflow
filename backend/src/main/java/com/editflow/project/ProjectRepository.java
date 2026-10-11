package com.editflow.project;

import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    boolean existsByClientIdAndPeriodMonthAndPeriodYear(Long clientId, int periodMonth, int periodYear);

    boolean existsByClientIdAndPeriodMonthAndPeriodYearAndIdNot(Long clientId, int periodMonth, int periodYear, Long id);

    long countByStatus(ProjectStatus status);

    @Query("select p from Project p join fetch p.client where p.id = :id")
    Optional<Project> findWithClientById(Long id);

    /**
     * Row lock used when recording payments or changing the fee, so two concurrent payments
     * can't both pass the "does not exceed the fee" check.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Project p where p.id = :id")
    Optional<Project> findByIdForUpdate(Long id);

    @Query("""
            select p from Project p join fetch p.client
            where (:status is null or p.status = :status)
            order by p.periodYear desc, p.periodMonth desc, p.id desc""")
    List<Project> findAllWithClient(ProjectStatus status);

    @Query("""
            select p from Project p join fetch p.client
            where p.client.id = :clientId
            order by p.periodYear desc, p.periodMonth desc, p.id desc""")
    List<Project> findByClientIdWithClient(Long clientId);

    @Query("""
            select p from Project p join fetch p.client
            where p.client.id in :clientIds""")
    List<Project> findByClientIdsWithClient(Collection<Long> clientIds);

    @Query("select coalesce(sum(p.totalFee), 0) from Project p where p.status in :statuses")
    BigDecimal sumFeesForStatuses(Collection<ProjectStatus> statuses);
}
