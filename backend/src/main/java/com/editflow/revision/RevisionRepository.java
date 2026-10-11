package com.editflow.revision;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface RevisionRepository extends JpaRepository<Revision, Long> {

    interface VideoRevisionCount {
        Long getVideoId();

        long getTotal();

        long getOpen();
    }

    @Query("select r from Revision r where r.video.id = :videoId order by r.createdAt desc, r.id desc")
    List<Revision> findByVideoIdOrdered(Long videoId);

    @Query("""
            select r.video.id as videoId, count(r) as total,
                   sum(case when r.status = com.editflow.revision.RevisionStatus.OPEN then 1 else 0 end) as open
            from Revision r where r.video.id in :videoIds
            group by r.video.id""")
    List<VideoRevisionCount> countByVideoIds(Collection<Long> videoIds);

    @Query("""
            select r from Revision r join fetch r.video v join fetch v.project p join fetch p.client
            where r.status = com.editflow.revision.RevisionStatus.OPEN
            order by r.createdAt asc, r.id asc""")
    List<Revision> findOpenWithVideo();

    @Query("""
            select r from Revision r join fetch r.video v join fetch v.project p join fetch p.client
            where (:status is null or r.status = :status)
            order by r.createdAt desc, r.id desc""")
    List<Revision> findAllWithVideo(RevisionStatus status);

    long countByStatus(RevisionStatus status);

    @Query("""
            select count(r) from Revision r
            where r.video.project.id = :projectId and r.status = com.editflow.revision.RevisionStatus.OPEN""")
    long countOpenByProjectId(Long projectId);
}
