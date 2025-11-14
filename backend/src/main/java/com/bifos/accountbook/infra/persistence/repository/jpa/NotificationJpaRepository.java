package com.bifos.accountbook.infra.persistence.repository.jpa;

import com.bifos.accountbook.domain.entity.Notification;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.NotificationType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Notification JPA Repository
 * Spring Data JPA 인터페이스 (Infrastructure Layer)
 */
public interface NotificationJpaRepository extends JpaRepository<Notification, Long> {

  Optional<Notification> findByNotificationUuid(CustomUuid notificationUuid);

  @Query("SELECT n FROM Notification n " +
      "WHERE n.familyUuid = :familyUuid " +
      "ORDER BY n.createdAt DESC")
  List<Notification> findAllByFamilyUuidOrderByCreatedAtDesc(@Param("familyUuid") CustomUuid familyUuid);

  @Query("SELECT n FROM Notification n " +
      "WHERE n.userUuid = :userUuid " +
      "ORDER BY n.createdAt DESC")
  List<Notification> findAllByUserUuidOrderByCreatedAtDesc(@Param("userUuid") CustomUuid userUuid);

  @Query("SELECT COUNT(n) FROM Notification n " +
      "WHERE n.familyUuid = :familyUuid AND n.isRead = false")
  long countByFamilyUuidAndIsReadFalse(@Param("familyUuid") CustomUuid familyUuid);

  @Query("SELECT COUNT(n) FROM Notification n " +
      "WHERE n.userUuid = :userUuid AND n.isRead = false")
  long countByUserUuidAndIsReadFalse(@Param("userUuid") CustomUuid userUuid);

  @Query("SELECT COUNT(n) > 0 FROM Notification n " +
      "WHERE n.familyUuid = :familyUuid " +
      "AND n.type = :type " +
      "AND n.yearMonth = :yearMonth")
  boolean existsByFamilyUuidAndTypeAndYearMonth(
      @Param("familyUuid") CustomUuid familyUuid,
      @Param("type") NotificationType type,
      @Param("yearMonth") String yearMonth);

  @Query("SELECT n FROM Notification n " +
      "WHERE n.familyUuid = :familyUuid " +
      "AND n.type = :type " +
      "ORDER BY n.createdAt DESC")
  List<Notification> findAllByFamilyUuidAndType(
      @Param("familyUuid") CustomUuid familyUuid,
      @Param("type") NotificationType type);

  @Query("SELECT n FROM Notification n " +
      "WHERE n.familyUuid = :familyUuid " +
      "AND n.userUuid IS NOT NULL " +
      "AND n.userUuid = :userUuid " +
      "ORDER BY n.createdAt DESC")
  List<Notification> findAllByFamilyUuidAndUserUuidOrderByCreatedAtDesc(
      @Param("familyUuid") CustomUuid familyUuid,
      @Param("userUuid") CustomUuid userUuid);

  @Modifying
  @Query("DELETE FROM Notification n WHERE n.createdAt < :dateTime")
  void deleteByCreatedAtBefore(@Param("dateTime") LocalDateTime dateTime);
}

