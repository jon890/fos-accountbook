package com.bifos.accountbook.family.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.bifos.accountbook.family.application.dto.CreateFamilyRequest;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.family.domain.entity.FamilyMember;
import com.bifos.accountbook.family.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.family.domain.repository.FamilyRepository;
import com.bifos.accountbook.family.domain.value.FamilyMemberRole;
import com.bifos.accountbook.shared.AbstractControllerTest;
import com.bifos.accountbook.user.domain.entity.User;
import com.bifos.accountbook.user.domain.entity.UserProfile;
import com.bifos.accountbook.user.domain.repository.UserProfileRepository;
import com.bifos.accountbook.user.domain.repository.UserRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

@DisplayName("가족 컨트롤러 통합 테스트")
class FamilyControllerTest extends AbstractControllerTest {

  @Autowired
  private UserProfileRepository userProfileRepository;

  @Autowired
  private FamilyMemberRepository familyMemberRepository;

  @Autowired
  private FamilyRepository familyRepository;

  @Autowired
  private UserRepository userRepository;

  private static final String API_BASE_URL = "/api/v1/families";

  @Test
  @DisplayName("가족 생성 - 성공 (첫 가족, 기본 가족으로 자동 설정)")
  void createFamily_success_firstFamily() throws Exception {
    // Given: TestFixtures로 유저 생성
    User testUser = fixtures.getDefaultUser();

    CreateFamilyRequest request = CreateFamilyRequest.builder()
                                                     .name("우리 가족")
                                                     .build();

    // When & Then
    mockMvc.perform(post(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
           .andDo(print())
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.success").value(true))
           .andExpect(jsonPath("$.data.name").value("우리 가족"))
           .andExpect(jsonPath("$.data.memberCount").value(1));

    // 기본 가족으로 설정되었는지 확인
    UserProfile profile = userProfileRepository.findByUserUuid(testUser.getUuid())
                                               .orElseThrow();

    assertThat(profile.getDefaultFamilyUuid()).isNotNull();
    assertThat(profile.getDefaultFamilyUuid().getValue()).isNotBlank();
  }

  @Test
  @DisplayName("가족 생성 - 성공 (두 번째 가족, 기본 가족으로 자동 설정 안됨)")
  void createFamily_success_secondFamily() throws Exception {
    // Given: TestFixtures로 유저 생성
    User testUser = fixtures.getDefaultUser();

    // Given: 첫 번째 가족 생성
    CreateFamilyRequest firstRequest = CreateFamilyRequest.builder()
                                                          .name("첫 번째 가족")
                                                          .build();

    mockMvc.perform(post(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstRequest)))
           .andExpect(status().isCreated());

    // 첫 번째 가족의 UUID 가져오기
    UserProfile profileAfterFirst = userProfileRepository.findByUserUuid(testUser.getUuid())
                                                         .orElseThrow();
    String firstFamilyUuid = profileAfterFirst.getDefaultFamilyUuid().getValue();

    // Given: 두 번째 가족 생성
    CreateFamilyRequest secondRequest = CreateFamilyRequest.builder()
                                                           .name("두 번째 가족")
                                                           .build();

    // When & Then
    mockMvc.perform(post(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondRequest)))
           .andDo(print())
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.success").value(true))
           .andExpect(jsonPath("$.data.name").value("두 번째 가족"));

    // 기본 가족이 변경되지 않았는지 확인 (여전히 첫 번째 가족)
    UserProfile profileAfterSecond = userProfileRepository.findByUserUuid(testUser.getUuid())
                                                          .orElseThrow();

    assertThat(profileAfterSecond.getDefaultFamilyUuid()).isNotNull();
    assertThat(profileAfterSecond.getDefaultFamilyUuid().getValue()).isEqualTo(firstFamilyUuid);
  }

  @Test
  @DisplayName("가족 생성 - 실패 (이름 누락)")
  void createFamily_fail_missingName() throws Exception {
    // Given: TestFixtures로 유저 생성 (인증을 위해)
    fixtures.getDefaultUser();

    CreateFamilyRequest request = CreateFamilyRequest.builder()
                                                     .build();

    // When & Then
    mockMvc.perform(post(API_BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
           .andDo(print())
           .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("가족 구성원 목록은 가입 순서로 전체 프로필과 역할을 반환하고 탈퇴 및 다른 가족은 제외한다")
  void getFamilyMembers_OrderedActiveMembers() throws Exception {
    User owner = fixtures.getDefaultUser();
    Family family = familyRepository.save(Family.builder().name("우리 가족").build());
    LocalDateTime ownerJoinedAt = LocalDateTime.of(2025, 5, 1, 9, 0);
    LocalDateTime memberJoinedAt = LocalDateTime.of(2025, 5, 2, 9, 0);
    User member = userRepository.save(User.builder()
                                         .name("구성원")
                                         .email("member@example.com")
                                         .image("https://example.com/member.png")
                                         .provider("google")
                                         .providerId("member-provider")
                                         .build());
    saveMember(family, member, FamilyMemberRole.MEMBER, memberJoinedAt);
    saveMember(family, owner, FamilyMemberRole.OWNER, ownerJoinedAt);

    User formerUser = fixtures.users.user().email("former@example.com").build();
    FamilyMember formerMember = saveMember(family, formerUser, FamilyMemberRole.MEMBER,
                                          ownerJoinedAt.minusDays(1));
    formerMember.leave();
    familyMemberRepository.save(formerMember);
    fixtures.families.family().name("다른 가족").owner(formerUser).build();

    mockMvc.perform(get(API_BASE_URL + "/{familyUuid}/members", family.getUuid().getValue()))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.success").value(true))
           .andExpect(jsonPath("$.data.length()").value(2))
           .andExpect(jsonPath("$.data[0].userUuid").value(owner.getUuid().getValue()))
           .andExpect(jsonPath("$.data[0].name").value(owner.getName()))
           .andExpect(jsonPath("$.data[0].email").value(owner.getEmail()))
           .andExpect(jsonPath("$.data[0].image").value(nullValue()))
           .andExpect(jsonPath("$.data[0].role").value("OWNER"))
           .andExpect(jsonPath("$.data[0].joinedAt").value("2025-05-01T09:00:00"))
           .andExpect(jsonPath("$.data[1].userUuid").value(member.getUuid().getValue()))
           .andExpect(jsonPath("$.data[1].name").value("구성원"))
           .andExpect(jsonPath("$.data[1].email").value("member@example.com"))
           .andExpect(jsonPath("$.data[1].image").value("https://example.com/member.png"))
           .andExpect(jsonPath("$.data[1].role").value("MEMBER"))
           .andExpect(jsonPath("$.data[1].joinedAt").value("2025-05-02T09:00:00"));
  }

  @Test
  @DisplayName("가입 시각이 같은 구성원은 ID 순서이고 이름과 사진이 없어도 포함한다")
  void getFamilyMembers_SameJoinedAtAndNullProfile() throws Exception {
    User owner = fixtures.getDefaultUser();
    Family family = familyRepository.save(Family.builder().name("우리 가족").build());
    LocalDateTime joinedAt = LocalDateTime.of(2025, 5, 1, 9, 0);
    saveMember(family, owner, FamilyMemberRole.OWNER, joinedAt);

    User unnamedUser = fixtures.users.user().name(null).email("unnamed@example.com").build();
    saveMember(family, unnamedUser, FamilyMemberRole.MEMBER, joinedAt);
    fixtures.users.setSecurityContext(unnamedUser);

    mockMvc.perform(get(API_BASE_URL + "/{familyUuid}/members", family.getUuid().getValue()))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.length()").value(2))
           .andExpect(jsonPath("$.data[0].userUuid").value(owner.getUuid().getValue()))
           .andExpect(jsonPath("$.data[1].userUuid").value(unnamedUser.getUuid().getValue()))
           .andExpect(jsonPath("$.data[1].name").value(nullValue()))
           .andExpect(jsonPath("$.data[1].image").value(nullValue()))
           .andExpect(jsonPath("$.data[1].email").value("unnamed@example.com"))
           .andExpect(jsonPath("$.data[1].role").value("MEMBER"))
           .andExpect(jsonPath("$.data[1].joinedAt").value("2025-05-01T09:00:00"));
  }

  @Test
  @DisplayName("가족 구성원이 아니면 기존 가족 접근 거부 오류를 반환한다")
  void getFamilyMembers_NonMemberDenied() throws Exception {
    Family family = fixtures.getDefaultFamily();
    User outsider = fixtures.users.user().email("outsider@example.com").build();
    fixtures.users.setSecurityContext(outsider);

    mockMvc.perform(get(API_BASE_URL + "/{familyUuid}/members", family.getUuid().getValue()))
           .andExpect(status().isForbidden())
           .andExpect(jsonPath("$.success").value(false))
           .andExpect(jsonPath("$.code").value("F003"));
  }

  @Test
  @DisplayName("탈퇴한 구성원은 가족 구성원 목록을 조회할 수 없다")
  void getFamilyMembers_FormerMemberDenied() throws Exception {
    User owner = fixtures.getDefaultUser();
    Family family = fixtures.getDefaultFamily();
    FamilyMember member = familyMemberRepository.findByFamilyUuidAndUserUuid(family.getUuid(), owner.getUuid())
                                               .orElseThrow();
    member.leave();
    familyMemberRepository.save(member);

    mockMvc.perform(get(API_BASE_URL + "/{familyUuid}/members", family.getUuid().getValue()))
           .andExpect(status().isForbidden())
           .andExpect(jsonPath("$.success").value(false))
           .andExpect(jsonPath("$.code").value("F003"));
  }

  private FamilyMember saveMember(Family family, User user, FamilyMemberRole role, LocalDateTime joinedAt) {
    return familyMemberRepository.save(FamilyMember.builder()
                                                  .familyUuid(family.getUuid())
                                                  .userUuid(user.getUuid())
                                                  .role(role)
                                                  .joinedAt(joinedAt)
                                                  .build());
  }
}
