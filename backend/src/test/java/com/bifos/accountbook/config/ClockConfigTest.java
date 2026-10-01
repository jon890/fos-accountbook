package com.bifos.accountbook.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class ClockConfigTest {

  @Test
  void clockUsesAsiaSeoulZone() {
    Clock clock = new ClockConfig().clock();

    assertThat(clock.getZone()).isEqualTo(ZoneId.of("Asia/Seoul"));
  }
}
