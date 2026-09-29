package com.bifos.accountbook.config.security;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AccessToken {

  private String token;
  private LocalDateTime expiresAt;
  private LocalDateTime issuedAt;
}
