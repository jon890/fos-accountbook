package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;

  /**
   * 사용자 정보 조회
   */
  @Transactional(readOnly = true)
  public User getUser(CustomUuid userUuid) {
    return userRepository.findByUuid(userUuid)
                         .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)
                             .addParameter("userUuid", userUuid.getValue()));
  }
}

