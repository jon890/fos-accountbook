package com.bifos.accountbook.notification.domain.converter;

import com.bifos.accountbook.shared.converter.AbstractCodeEnumConverter;

import com.bifos.accountbook.notification.domain.value.NotificationType;
import jakarta.persistence.Converter;

/**
 * NotificationType을 DB 코드값으로 변환하는 컨버터
 */
@Converter(autoApply = true)
public class NotificationTypeConverter extends AbstractCodeEnumConverter<NotificationType> {

  public NotificationTypeConverter() {
    super(NotificationType.class);
  }
}

