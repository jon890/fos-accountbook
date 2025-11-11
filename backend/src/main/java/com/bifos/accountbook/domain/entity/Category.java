package com.bifos.accountbook.domain.entity;

import com.bifos.accountbook.domain.value.CategoryStatus;
import com.bifos.accountbook.domain.value.CustomUuid;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private CustomUuid uuid;

    @Column(name = "family_uuid", nullable = false, length = 36)
    private CustomUuid familyUuid;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 7)
    @Builder.Default
    private String color = "#6366f1";

    @Column(length = 50)
    private String icon;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 카테고리 상태
     * CategoryStatusConverter가 자동으로 코드값으로 변환하여 DB에 저장합니다.
     */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CategoryStatus status = CategoryStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_uuid", referencedColumnName = "uuid", insertable = false, updatable = false)
    private Family family;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Expense> expenses = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (uuid == null) {
            uuid = CustomUuid.generate();
        }
        // createdAt, updatedAt은 JPA Auditing이 자동 관리
    }

    // ========== 비즈니스 메서드 ==========

    /**
     * 카테고리 이름 변경
     */
    public void updateName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("카테고리 이름은 필수입니다");
        }
        this.name = name;
    }

    /**
     * 카테고리 색상 변경
     */
    public void updateColor(String color) {
        if (color != null && !color.matches("^#[0-9a-fA-F]{6}$")) {
            throw new IllegalArgumentException("유효하지 않은 색상 코드입니다");
        }
        this.color = color != null ? color : this.color;
    }

    /**
     * 카테고리 아이콘 변경
     */
    public void updateIcon(String icon) {
        this.icon = icon;
    }

    /**
     * 카테고리 삭제 (Soft Delete)
     */
    public void delete() {
        this.status = CategoryStatus.DELETED;
    }
}
