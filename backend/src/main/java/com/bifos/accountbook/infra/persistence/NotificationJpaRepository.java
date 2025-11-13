package com.bifos.accountbook.infra.persistence;

import com.bifos.accountbook.domain.entity.Notification;
import com.bifos.accountbook.domain.repository.NotificationRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.NotificationType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/**
 * 알림 Repository JPA 구현체
 */
@Repository
public class NotificationJpaRepository implements NotificationRepository {

  @PersistenceContext
  private EntityManager em;

  @Override
  public Notification save(Notification notification) {
    if (notification.getId() == null) {
      em.persist(notification);
      return notification;
    } else {
      return em.merge(notification);
    }
  }

  @Override
  public Optional<Notification> findByNotificationUuid(CustomUuid notificationUuid) {
    List<Notification> results = em.createQuery(
                                       "SELECT n FROM Notification n WHERE n.notificationUuid = :notificationUuid",
                                       Notification.class)
                                   .setParameter("notificationUuid", notificationUuid)
                                   .getResultList();
    return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
  }

  @Override
  public List<Notification> findAllByFamilyUuidOrderByCreatedAtDesc(CustomUuid familyUuid) {
    return em.createQuery(
                 "SELECT n FROM Notification n " +
                     "WHERE n.familyUuid = :familyUuid " +
                     "ORDER BY n.createdAt DESC",
                 Notification.class)
             .setParameter("familyUuid", familyUuid)
             .getResultList();
  }

  @Override
  public List<Notification> findAllByUserUuidOrderByCreatedAtDesc(CustomUuid userUuid) {
    return em.createQuery(
                 "SELECT n FROM Notification n " +
                     "WHERE n.userUuid = :userUuid " +
                     "ORDER BY n.createdAt DESC",
                 Notification.class)
             .setParameter("userUuid", userUuid)
             .getResultList();
  }

  @Override
  public long countByFamilyUuidAndIsReadFalse(CustomUuid familyUuid) {
    return em.createQuery(
                 "SELECT COUNT(n) FROM Notification n " +
                     "WHERE n.familyUuid = :familyUuid AND n.isRead = false",
                 Long.class)
             .setParameter("familyUuid", familyUuid)
             .getSingleResult();
  }

  @Override
  public long countByUserUuidAndIsReadFalse(CustomUuid userUuid) {
    return em.createQuery(
                 "SELECT COUNT(n) FROM Notification n " +
                     "WHERE n.userUuid = :userUuid AND n.isRead = false",
                 Long.class)
             .setParameter("userUuid", userUuid)
             .getSingleResult();
  }

  @Override
  public boolean existsByFamilyUuidAndTypeAndYearMonth(
      CustomUuid familyUuid,
      NotificationType type,
      String yearMonth) {
    Long count = em.createQuery(
                       "SELECT COUNT(n) FROM Notification n " +
                           "WHERE n.familyUuid = :familyUuid " +
                           "AND n.type = :type " +
                           "AND n.yearMonth = :yearMonth",
                       Long.class)
                   .setParameter("familyUuid", familyUuid)
                   .setParameter("type", type)
                   .setParameter("yearMonth", yearMonth)
                   .getSingleResult();
    return count > 0;
  }

  @Override
  public List<Notification> findAllByFamilyUuidAndType(CustomUuid familyUuid, NotificationType type) {
    return em.createQuery(
                 "SELECT n FROM Notification n " +
                     "WHERE n.familyUuid = :familyUuid " +
                     "AND n.type = :type " +
                     "ORDER BY n.createdAt DESC",
                 Notification.class)
             .setParameter("familyUuid", familyUuid)
             .setParameter("type", type)
             .getResultList();
  }

  @Override
  public void deleteByCreatedAtBefore(LocalDateTime dateTime) {
    em.createQuery("DELETE FROM Notification n WHERE n.createdAt < :dateTime")
      .setParameter("dateTime", dateTime)
      .executeUpdate();
  }
}

