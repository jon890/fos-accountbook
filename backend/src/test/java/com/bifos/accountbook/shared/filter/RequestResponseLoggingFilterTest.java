package com.bifos.accountbook.shared.filter;

import static org.assertj.core.api.Assertions.assertThat;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.servlet.FilterChain;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RequestResponseLoggingFilterTest {

  private static final String FILTER_LOGGER_NAME = RequestResponseLoggingFilter.class.getName();

  @Test
  void infoLogDoesNotContainBodiesAndMasksInvitationTokenAndQueryValues() throws Exception {
    String requestBody = "{\"amount\":10000}";
    String responseBody = "{\"amount\":10000}";
    String authResponseBody = "{\"accessToken\":\"secret-access\"}";
    FilterLogCapture capture = new FilterLogCapture(Level.INFO);

    try {
      runFilter(capture.filter(), "/api/v1/invitations/token/secret-invitation", "email=user@example.com",
                requestBody, responseBody);
      runFilter(capture.filter(), "/api/v1/auth/refresh", null,
                "{\"refreshToken\":\"secret-refresh\"}", authResponseBody);

      List<String> messages = capture.messages();

      assertThat(messages).noneMatch(message -> message.contains(requestBody));
      assertThat(messages).noneMatch(message -> message.contains(responseBody));
      assertThat(messages).noneMatch(message -> message.contains(authResponseBody));
      assertThat(messages).noneMatch(message -> message.contains("secret-invitation"));
      assertThat(messages).noneMatch(message -> message.contains("user@example.com"));
      assertThat(messages).noneMatch(message -> message.contains("short-token"));
      assertThat(messages).anyMatch(message -> message.contains("[RES] POST ")
          && message.contains("/api/v1/invitations/token/***?email=***")
          && message.contains("→ 200"));
    } finally {
      capture.close();
    }
  }

  @Test
  void debugLogContainsGeneralBodiesButSkipsAuthenticationBodies() throws Exception {
    String generalRequestBody = "{\"amount\":10000}";
    String generalResponseBody = "{\"result\":\"saved\"}";
    String refreshRequestBody = "{\"refreshToken\":\"secret-refresh\"}";
    String refreshResponseBody = "{\"accessToken\":\"secret-access\"}";
    String apiTokenRequestBody = "{\"name\":\"bank-link\"}";
    String apiTokenResponseBody = "{\"token\":\"secret-api-token\"}";
    FilterLogCapture capture = new FilterLogCapture(Level.DEBUG);

    try {
      runFilter(capture.filter(), "/api/v1/expenses", null, generalRequestBody, generalResponseBody);
      runFilter(capture.filter(), "/api/v1/auth/refresh", null, refreshRequestBody, refreshResponseBody);
      runFilter(capture.filter(), "/api/v1/users/me/api-tokens", null,
                apiTokenRequestBody, apiTokenResponseBody);
      runFilter(capture.filter(), "/api/v1/invitations/token/secret-invitation", "email=user@example.com",
                "", "");

      List<String> messages = capture.messages();

      assertThat(messages).anyMatch(message -> message.contains(generalRequestBody));
      assertThat(messages).anyMatch(message -> message.contains(generalResponseBody));
      assertThat(messages).noneMatch(message -> message.contains(refreshRequestBody));
      assertThat(messages).noneMatch(message -> message.contains(refreshResponseBody));
      assertThat(messages).noneMatch(message -> message.contains(apiTokenRequestBody));
      assertThat(messages).noneMatch(message -> message.contains(apiTokenResponseBody));
      assertThat(messages).noneMatch(message -> message.contains("secret-invitation"));
      assertThat(messages).noneMatch(message -> message.contains("user@example.com"));
      assertThat(messages).anyMatch(message -> message.contains("인증 경로라 생략"));
      assertThat(messages).anyMatch(message -> message.contains("/api/v1/invitations/token/***?email=***"));
    } finally {
      capture.close();
    }
  }

  private void runFilter(RequestResponseLoggingFilter filter, String uri, String query, String requestBody,
                         String responseBody) throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", uri);
    request.setQueryString(query);
    request.setContent(requestBody.getBytes(StandardCharsets.UTF_8));
    request.addHeader("Authorization", "short-token");

    MockHttpServletResponse response = new MockHttpServletResponse();
    FilterChain chain = (servletRequest, servletResponse) -> {
      servletRequest.getInputStream().readAllBytes();
      servletResponse.getOutputStream().write(responseBody.getBytes(StandardCharsets.UTF_8));
    };

    filter.doFilter(request, response, chain);
  }

  private static final class FilterLogCapture implements AutoCloseable {

    private final Logger logger;
    private final Level originalLevel;
    private final ListAppender<ILoggingEvent> appender;

    private FilterLogCapture(Level level) {
      logger = (Logger) LoggerFactory.getLogger(FILTER_LOGGER_NAME);
      originalLevel = logger.getLevel();
      appender = new ListAppender<>();
      appender.start();
      logger.addAppender(appender);
      logger.setLevel(level);
    }

    private RequestResponseLoggingFilter filter() {
      return new RequestResponseLoggingFilter();
    }

    private List<String> messages() {
      return appender.list.stream().map(ILoggingEvent::getFormattedMessage).toList();
    }

    @Override
    public void close() {
      logger.setLevel(originalLevel);
      logger.detachAppender(appender);
      appender.stop();
    }
  }
}
