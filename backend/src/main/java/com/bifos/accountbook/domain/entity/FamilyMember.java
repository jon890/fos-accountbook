package com.bifos.accountbook.domain.entity;

import com.bifos.accountbook.domain.value.CustomUuid;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "family_members", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "family_uuid", "user_uuid" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FamilyMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private CustomUuid uuid;

    @Column(name = "family_uuid", nullable = false, length = 36)
    private CustomUuid familyUuid;

    @Column(name = "user_uuid", nullable = false, length = 36)
    private CustomUuid userUuid;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "member";

    @Column(name = "joined_at", nullable = false)
    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_uuid", referencedColumnName = "uuid", insertable = false, updatable = false)
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uuid", referencedColumnName = "uuid", insertable = false, updatable = false)
    private User user;

    @PrePersist
    public void prePersist() {
        if (uuid == null) {
            uuid = CustomUuid.generate();
        }
    }
}
