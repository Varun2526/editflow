package com.editflow.inquiry;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    @Query("select i from Inquiry i where (:status is null or i.status = :status) order by i.createdAt desc, i.id desc")
    List<Inquiry> findAllByStatus(InquiryStatus status);

    long countByStatus(InquiryStatus status);
}
