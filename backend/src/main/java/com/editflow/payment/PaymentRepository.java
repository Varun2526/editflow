package com.editflow.payment;

import com.editflow.project.ProjectStatus;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    interface ProjectTotal {
        Long getProjectId();

        BigDecimal getTotal();
    }

    @Query("select p from Payment p where p.project.id = :projectId order by p.paymentDate desc, p.id desc")
    List<Payment> findByProjectIdOrdered(Long projectId);

    @Query("select p from Payment p join fetch p.project pr join fetch pr.client where p.id = :id")
    Optional<Payment> findWithProjectById(Long id);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.project.id = :projectId")
    BigDecimal sumByProjectId(Long projectId);

    @Query("""
            select p.project.id as projectId, sum(p.amount) as total
            from Payment p where p.project.id in :projectIds
            group by p.project.id""")
    List<ProjectTotal> sumByProjectIds(Collection<Long> projectIds);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.project.status in :statuses")
    BigDecimal sumForProjectStatuses(Collection<ProjectStatus> statuses);

    @Query("""
            select p from Payment p join fetch p.project pr join fetch pr.client
            order by p.paymentDate desc, p.id desc limit 20""")
    List<Payment> findRecentWithProject();
}
