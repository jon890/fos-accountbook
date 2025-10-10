package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.auth.AuthResponse;
import com.bifos.accountbook.application.dto.auth.LoginRequest;
import com.bifos.accountbook.application.dto.auth.RegisterRequest;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.infra.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 사용자 등록 (NextAuth에서 사용자 정보 전달)
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 이미 존재하는 사용자인지 확인
        if (userRepository.existsByEmail(request.getEmail())) {
            // 이미 존재하면 로그인 처리
            return loginExistingUser(request.getEmail());
        }

        // 새 사용자 생성
        User user = User.builder()
                .id(request.getId())
                .email(request.getEmail())
                .name(request.getName())
                .image(request.getImage())
                .build();

        user = userRepository.save(user);
        log.info("Registered new user: {} ({})", user.getEmail(), user.getId());

        return generateAuthResponse(user);
    }

    /**
     * 로그인 (이메일로 사용자 조회 후 JWT 발급)
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        if (user.getDeletedAt() != null) {
            throw new IllegalStateException("삭제된 사용자입니다");
        }

        return generateAuthResponse(user);
    }

    /**
     * 기존 사용자 로그인
     */
    private AuthResponse loginExistingUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        if (user.getDeletedAt() != null) {
            throw new IllegalStateException("삭제된 사용자입니다");
        }

        return generateAuthResponse(user);
    }

    /**
     * Refresh 토큰으로 새 Access 토큰 발급
     */
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 refresh 토큰입니다");
        }

        String userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        if (user.getDeletedAt() != null) {
            throw new IllegalStateException("삭제된 사용자입니다");
        }

        return generateAuthResponse(user);
    }

    /**
     * 현재 사용자 정보 조회
     */
    @Transactional(readOnly = true)
    public AuthResponse.UserInfo getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        return AuthResponse.UserInfo.builder()
                .id(user.getId())
                .uuid(user.getUuid())
                .email(user.getEmail())
                .name(user.getName())
                .image(user.getImage())
                .build();
    }

    /**
     * JWT 토큰 및 사용자 정보 응답 생성
     */
    private AuthResponse generateAuthResponse(User user) {
        var authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));

        String accessToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), authorities);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400L) // 24시간 (초 단위)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .uuid(user.getUuid())
                        .email(user.getEmail())
                        .name(user.getName())
                        .image(user.getImage())
                        .build())
                .build();
    }
}

