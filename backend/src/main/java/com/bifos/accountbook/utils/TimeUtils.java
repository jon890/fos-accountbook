package com.bifos.accountbook.utils;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class TimeUtils {

  public static LocalDateTime toLocalDateTime(Date date) {
    return LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());
  }
}
