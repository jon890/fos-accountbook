package com.bifos.accountbook.config;

import com.bifos.accountbook.presentation.resolver.LoginUserArgumentResolver;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Spring MVC 설정
 * ArgumentResolver 등록 및 기타 MVC 관련 설정을 담당합니다.
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

  private final LoginUserArgumentResolver loginUserArgumentResolver;

  /**
   * 커스텀 ArgumentResolver 등록
   * @LoginUser 애노테이션을 처리할 수 있도록 LoginUserArgumentResolver를 추가합니다.
   */
  @Override
  public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
    resolvers.add(loginUserArgumentResolver);
  }
}

