package com.bifos.accountbook.user.application.service;

import com.bifos.accountbook.shared.exception.BusinessException;
import com.bifos.accountbook.shared.exception.ErrorCode;
import com.bifos.accountbook.user.domain.entity.User;
import com.bifos.accountbook.user.domain.repository.UserRepository;
import com.bifos.accountbook.shared.value.CustomUuid;
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

