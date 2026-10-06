package com.bifos.accountbook.shared.exception;

import static org.assertj.core.api.Assertions.assertThat;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.bifos.accountbook.shared.dto.ApiErrorResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;

class GlobalExceptionHandlerTest {

  private static final String HANDLER_LOGGER_NAME = GlobalExceptionHandler.class.getName();
  private static final String SENSITIVE_PARAMETER = "secret-invitation-token";

  @Test
  void prodResponseOmitsParametersAndLogsClientErrorAsWarnWithoutThrowable() {
    HandlerLogCapture capture = new HandlerLogCapture();

    try {
      ApiErrorResponse response =
          handlerWithProfile("prod")
              .handleBusinessException(exception(ErrorCode.INVALID_INVITATION_TOKEN), request())
              .getBody();

      ILoggingEvent event = capture.singleEvent();

      assertThat(response.getParameters()).isNull();
      assertThat(response.getDebugInfo()).isNull();
      assertThat(event.getLevel()).isEqualTo(Level.WARN);
      assertThat(event.getThrowableProxy()).isNull();
      assertThat(event.getFormattedMessage()).doesNotContain(SENSITIVE_PARAMETER);
    } finally {
      capture.close();
    }
  }

  @Test
  void testResponseIncludesParametersAndLogsServerErrorWithThrowable() {
    HandlerLogCapture capture = new HandlerLogCapture();

    try {
      ApiErrorResponse response =
          handlerWithProfile("test")
              .handleBusinessException(exception(ErrorCode.INTERNAL_SERVER_ERROR), request())
              .getBody();

      ILoggingEvent event = capture.singleEvent();

      assertThat(response.getParameters()).containsEntry("token", SENSITIVE_PARAMETER);
      assertThat(event.getLevel()).isEqualTo(Level.ERROR);
      assertThat(event.getThrowableProxy()).isNotNull();
      assertThat(event.getFormattedMessage()).doesNotContain(SENSITIVE_PARAMETER);
    } finally {
      capture.close();
    }
  }

  private GlobalExceptionHandler handlerWithProfile(String profile) {
    MockEnvironment environment = new MockEnvironment();
    environment.setActiveProfiles(profile);
    return new GlobalExceptionHandler(environment);
  }

  private BusinessException exception(ErrorCode errorCode) {
    return new BusinessException(errorCode)
        .addParameter("token", SENSITIVE_PARAMETER)
        .addDebugInfo("requestId", "request-1");
  }

  private MockHttpServletRequest request() {
    return new MockHttpServletRequest("POST", "/api/v1/invitations/token/secret-invitation");
  }

  private static final class HandlerLogCapture implements AutoCloseable {

    private final Logger logger;
    private final Level originalLevel;
    private final ListAppender<ILoggingEvent> appender;

    private HandlerLogCapture() {
      logger = (Logger) LoggerFactory.getLogger(HANDLER_LOGGER_NAME);
      originalLevel = logger.getLevel();
      appender = new ListAppender<>();
      appender.start();
      logger.addAppender(appender);
      logger.setLevel(Level.DEBUG);
    }

    private ILoggingEvent singleEvent() {
      List<ILoggingEvent> events = appender.list;
      assertThat(events).hasSize(1);
      return events.getFirst();
    }

    @Override
    public void close() {
      logger.setLevel(originalLevel);
      logger.detachAppender(appender);
      appender.stop();
    }
  }
}
