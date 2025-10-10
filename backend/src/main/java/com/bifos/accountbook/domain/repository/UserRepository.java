package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByUuid(UUID uuid);
    
    boolean existsByEmail(String email);
}

