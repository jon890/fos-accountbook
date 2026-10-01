package com.bifos.accountbook.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.ZoneId;
import java.util.TimeZone;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;

@Isolated
class ClockConfigTest {

  @Test
  void clockUsesSystemDefaultZone() {
    TimeZone savedDefault = TimeZone.getDefault();
    try {
      TimeZone.setDefault(TimeZone.getTimeZone("UTC"));

      Clock clock = new ClockConfig().clock();

      assertThat(clock.getZone()).isEqualTo(ZoneId.of("UTC"));
    } finally {
      TimeZone.setDefault(savedDefault);
    }
  }
}
