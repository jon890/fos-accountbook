package com.bifos.accountbook.config.converter;

import com.bifos.accountbook.domain.value.CustomUuid;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * String을 CustomUuid로 변환하는 Spring Converter
 * 
 * <p>@PathVariable, @RequestParam 등에서 String을 CustomUuid로 자동 변환합니다.</p>
 * 
 * <h3>사용 예시</h3>
 * <pre>
 * {@code
 * @GetMapping("/families/{familyUuid}")
 * public ResponseEntity<?> getFamily(@PathVariable CustomUuid familyUuid) {
 *   // String이 자동으로 CustomUuid로 변환됨
 * }
 * }
 * </pre>
 * 
 * <h3>변환 로직</h3>
 * <ul>
 *   <li>null 또는 빈 문자열: IllegalArgumentException 발생</li>
 *   <li>유효한 UUID 형식: CustomUuid 객체 생성</li>
 *   <li>잘못된 형식: IllegalArgumentException 발생 (CustomUuid.from()에서 검증)</li>
 * </ul>
 * 
 * @see CustomUuid
 */
@Component
public class StringToCustomUuidConverter implements Converter<String, CustomUuid> {

  @Override
  public CustomUuid convert(String source) {
    if (source == null || source.trim().isEmpty()) {
      throw new IllegalArgumentException("UUID value cannot be null or empty");
    }
    return CustomUuid.from(source.trim());
  }
}

