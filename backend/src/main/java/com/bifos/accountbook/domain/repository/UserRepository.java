package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByUuid(String uuid); // VARCHAR(36) 문자열 형식
    
    boolean existsByEmail(String email);
}

