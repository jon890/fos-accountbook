package com.bifos.accountbook.domain.entity;

import com.bifos.accountbook.domain.value.CustomUuid;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 사용자 프로필 엔티티
 * 사용자별 설정 정보 관리 (시간대, 언어, 통화 등)
 */
@Entity
@Table(name = "user_profiles")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_uuid", nullable = false, unique = true, length = 36)
    private CustomUuid userUuid;

    /**
     * 사용자의 선호 시간대
     * 예: "UTC", "Asia/Seoul", "America/New_York"
     * 기본값: "Asia/Seoul"
     */
    @Column(nullable = false, length = 50)
    @Builder.Default
    private String timezone = "Asia/Seoul";

    /**
     * 언어 코드
     * 예: "ko", "en", "ja"
     * 기본값: "ko"
     */
    @Column(length = 10)
    @Builder.Default
    private String language = "ko";

    /**
     * 통화 코드
     * 예: "KRW", "USD", "JPY"
     * 기본값: "KRW"
     */
    @Column(length = 10)
    @Builder.Default
    private String currency = "KRW";

    /**
     * 기본 가족 UUID
     * 사용자가 마지막으로 선택한 가족/그룹의 UUID
     */
    @Column(name = "default_family_uuid", length = 36)
    private CustomUuid defaultFamilyUuid;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 기본 프로필 생성
     */
    public static UserProfile createDefault(CustomUuid userUuid) {
        return UserProfile.builder()
                .userUuid(userUuid)
                .timezone("Asia/Seoul")
                .language("ko")
                .currency("KRW")
                .build();
    }

    /**
     * 시간대 변경
     */
    public void updateTimezone(String timezone) {
        this.timezone = timezone;
    }

    /**
     * 언어 변경
     */
    public void updateLanguage(String language) {
        this.language = language;
    }

    /**
     * 통화 변경
     */
    public void updateCurrency(String currency) {
        this.currency = currency;
    }

    /**
     * 기본 가족 설정
     */
    public void updateDefaultFamily(CustomUuid familyUuid) {
        this.defaultFamilyUuid = familyUuid;
    }
}

