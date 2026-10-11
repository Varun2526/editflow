package com.editflow.video;

import com.editflow.project.ProjectStatus;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface VideoRepository extends JpaRepository<Video, Long> {

    @Query("select v from Video v where v.project.id = :projectId order by v.deadline asc nulls last, v.id asc")
    List<Video> findByProjectIdOrdered(Long projectId);

    /** Admin video index: every video outside archived projects, optionally filtered by status. */
    @Query("""
            select v from Video v join fetch v.project p join fetch p.client
            where p.status <> com.editflow.project.ProjectStatus.ARCHIVED and (:status is null or v.status = :status)
            order by v.deadline asc nulls last, v.id asc""")
    List<Video> findAllInOpenProjects(VideoStatus status);

    @Query("select v from Video v join fetch v.project p join fetch p.client where v.id = :id")
    Optional<Video> findWithProjectAndClientById(Long id);

    interface ProjectStatusCount {
        Long getProjectId();

        VideoStatus getStatus();

        long getCount();
    }

    interface ProjectCount {
        Long getProjectId();

        long getCount();
    }

    interface StatusCount {
        VideoStatus getStatus();

        long getCount();
    }

    @Query("""
            select v.project.id as projectId, v.status as status, count(v) as count
            from Video v where v.project.id in :projectIds
            group by v.project.id, v.status""")
    List<ProjectStatusCount> countByProjectAndStatus(Collection<Long> projectIds);

    /** Overdue rule: see {@link VideoDeadlines#isOverdue}. */
    @Query("""
            select v.project.id as projectId, count(v) as count
            from Video v
            where v.project.id in :projectIds and v.deadline < :today and v.status <> com.editflow.video.VideoStatus.DELIVERED
            group by v.project.id""")
    List<ProjectCount> countOverdueByProject(Collection<Long> projectIds, LocalDate today);

    @Query("""
            select v.status as status, count(v) as count
            from Video v where v.project.status = :projectStatus
            group by v.status""")
    List<StatusCount> countByStatusForProjectStatus(ProjectStatus projectStatus);

    @Query("""
            select count(v) from Video v
            where v.project.status = :projectStatus and v.deadline < :today and v.status <> com.editflow.video.VideoStatus.DELIVERED""")
    long countOverdueForProjectStatus(ProjectStatus projectStatus, LocalDate today);

    // ---- Today's tasks (videos in active projects) ----

    @Query("""
            select v from Video v join fetch v.project p join fetch p.client
            where p.status = com.editflow.project.ProjectStatus.ACTIVE and v.deadline = :today and v.status <> com.editflow.video.VideoStatus.DELIVERED
            order by v.id""")
    List<Video> findDueOn(LocalDate today);

    @Query("""
            select v from Video v join fetch v.project p join fetch p.client
            where p.status = com.editflow.project.ProjectStatus.ACTIVE and v.deadline < :today and v.status <> com.editflow.video.VideoStatus.DELIVERED
            order by v.deadline, v.id""")
    List<Video> findOverdue(LocalDate today);

    @Query("""
            select v from Video v join fetch v.project p join fetch p.client
            where p.status = com.editflow.project.ProjectStatus.ACTIVE and v.status = :status
            order by v.deadline asc nulls last, v.id""")
    List<Video> findInActiveProjectsByStatus(VideoStatus status);

    @Query("""
            select v from Video v
            where v.project.id = :projectId and v.status <> com.editflow.video.VideoStatus.DELIVERED and v.deadline is not null
            order by v.deadline, v.id limit 5""")
    List<Video> findUpcomingDeadlines(Long projectId);
}
