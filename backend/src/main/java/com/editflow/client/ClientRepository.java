package com.editflow.client;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ClientRepository extends JpaRepository<Client, Long> {

    Optional<Client> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    @Query("select c from Client c order by c.name")
    List<Client> findAllOrdered();

    Optional<Client> findByUserId(Long userId);

    @Query("select c.id from Client c where c.user.id = :userId")
    Optional<Long> findIdByUserId(Long userId);
}
