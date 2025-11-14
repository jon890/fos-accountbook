package com.bifos.accountbook.common.fixtures;

import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.FamilyMemberStatus;
import java.math.BigDecimal;

/**
 * Family 도메인 테스트 Fixture
 *
 * 가족 생성 및 멤버 관리를 담당
 */
public class FamilyFixtures {

  private final FamilyRepository familyRepository;
  private final FamilyMemberRepository familyMemberRepository;
  private final UserFixtures userFixtures;

  // 기본 family (lazy initialization)
  private Family defaultFamily;

  public FamilyFixtures(
      FamilyRepository familyRepository,
      FamilyMemberRepository familyMemberRepository,
      UserFixtures userFixtures) {
    this.familyRepository = familyRepository;
    this.familyMemberRepository = familyMemberRepository;
    this.userFixtures = userFixtures;
  }

  /**
   * 기본 가족 반환 (lazy initialization)
   */
  public Family getDefaultFamily() {
    if (defaultFamily == null) {
      defaultFamily = family().build();
    }
    return defaultFamily;
  }

  /**
   * Family Builder 시작점
   */
  public FamilyBuilder family() {
    return new FamilyBuilder(familyRepository, familyMemberRepository, userFixtures);
  }

  /**
   * 캐시 초기화
   */
  public void clear() {
    this.defaultFamily = null;
  }

  /**
   * Family Builder - 가족 생성
   */
  public static class FamilyBuilder {
    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserFixtures userFixtures;
    private String name = "Test Family";
    private BigDecimal budget = BigDecimal.ZERO;
    private User owner;

    FamilyBuilder(FamilyRepository familyRepository,
                  FamilyMemberRepository familyMemberRepository,
                  UserFixtures userFixtures) {
      this.familyRepository = familyRepository;
      this.familyMemberRepository = familyMemberRepository;
      this.userFixtures = userFixtures;
    }

    public FamilyBuilder name(String name) {
      this.name = name;
      return this;
    }

    public FamilyBuilder budget(BigDecimal budget) {
      this.budget = budget;
      return this;
    }

    public FamilyBuilder owner(User owner) {
      this.owner = owner;
      return this;
    }

    public Family build() {
      if (owner == null) {
        owner = userFixtures.getDefaultUser();
      }

      Family family = Family.builder()
                            .name(name)
                            .monthlyBudget(budget)
                            .build();
      family = familyRepository.save(family);

      // 가족 멤버 자동 추가
      FamilyMember member = FamilyMember.builder()
                                        .uuid(CustomUuid.generate())
                                        .familyUuid(family.getUuid())
                                        .userUuid(owner.getUuid())
                                        .status(FamilyMemberStatus.ACTIVE)
                                        .build();
      familyMemberRepository.save(member);

      return family;
    }
  }
}

