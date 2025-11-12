package com.bifos.accountbook.common;

import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.FamilyMemberStatus;
import lombok.Getter;
import org.junit.jupiter.api.extension.*;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * 테스트용 데이터 자동 생성 및 관리 Extension
 * 
 * <h3>사용법:</h3>
 * <pre>{@code
 * @FosSpringBootTest
 * class MyTest {
 *     @RegisterExtension
 *     TestUserHolder holder = new TestUserHolder();
 * 
 *     @Test
 *     void test() {
 *         // 기본 데이터 (lazy 생성)
 *         User user = holder.getUser();
 *         Family family = holder.getFamily();
 *         Category category = holder.getCategory();
 *         
 *         // 커스텀 데이터 생성
 *         Family customFamily = holder.createFamily("우리집", new BigDecimal("1000000"));
 *         Category food = holder.createCategory(customFamily, "식비", "#ef4444", "🍚");
 *     }
 * }
 * }</pre>
 * 
 * <h3>장점:</h3>
 * <ul>
 *     <li>setUp 메서드 불필요</li>
 *     <li>테스트 간 데이터 공유 방지 (각 테스트마다 새로 생성)</li>
 *     <li>필요한 데이터만 생성 (lazy initialization)</li>
 *     <li>코드가 간결하고 명확</li>
 * </ul>
 */
public class TestUserHolder implements BeforeEachCallback, AfterEachCallback, ParameterResolver {

    private static final String TEST_USER_KEY = "testUser";

    @Getter
    private User user;
    
    private ApplicationContext applicationContext;
    
    // 캐시된 기본 엔티티들 (각 테스트마다 새로 생성)
    private Family defaultFamily;
    private Category defaultCategory;
    private final Map<String, Family> familyCache = new HashMap<>();
    private final Map<String, Category> categoryCache = new HashMap<>();

    @Override
    public void beforeEach(ExtensionContext context) {
        // Spring ApplicationContext 저장
        this.applicationContext = SpringExtension.getApplicationContext(context);
        
        // UserRepository 가져오기
        UserRepository userRepository = applicationContext.getBean(UserRepository.class);

        // SecurityContext 초기화
        SecurityContextHolder.clearContext();

        // 테스트 사용자 생성
        this.user = User.builder()
                .provider("google")
                .providerId("test-provider-id-" + System.currentTimeMillis())
                .email("test@example.com")
                .name("Test User")
                .build();
        this.user = userRepository.save(this.user);

        // ExtensionContext에 테스트 유저 저장
        getStore(context).put(TEST_USER_KEY, this.user);

        // SecurityContext에 인증 정보 설정
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(this.user.getUuid().getValue(), null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Override
    public void afterEach(ExtensionContext context) {
        // SecurityContext 클리어
        SecurityContextHolder.clearContext();

        // ExtensionContext에서 테스트 유저 제거
        getStore(context).remove(TEST_USER_KEY);
        
        // 캐시 초기화
        this.user = null;
        this.defaultFamily = null;
        this.defaultCategory = null;
        this.familyCache.clear();
        this.categoryCache.clear();
        this.applicationContext = null;
    }

    /**
     * ExtensionContext에서 테스트 유저를 가져오는 정적 메서드
     */
    public static User getTestUser(ExtensionContext context) {
        return (User) getStore(context).get(TEST_USER_KEY);
    }

    private static ExtensionContext.Store getStore(ExtensionContext context) {
        return context.getStore(ExtensionContext.Namespace.create(TestUserHolder.class));
    }

    /**
     * 파라미터가 TestUserHolder 타입인지 확인
     */
    @Override
    public boolean supportsParameter(ParameterContext parameterContext, ExtensionContext extensionContext) {
        return parameterContext.getParameter().getType().equals(TestUserHolder.class);
    }

    /**
     * TestUserHolder 인스턴스를 파라미터로 제공
     */
    @Override
    public Object resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) {
        return this;
    }
    
    // ============================================================
    // 편의 메서드: 테스트 데이터 생성 (Lazy Initialization)
    // ============================================================
    
    /**
     * 기본 테스트 가족 반환 (없으면 자동 생성)
     * 
     * - 가족명: "Test Family"
     * - 월 예산: 0
     * - 가족 멤버: 테스트 사용자 (ACTIVE)
     */
    public Family getFamily() {
        if (defaultFamily == null) {
            defaultFamily = createFamily("Test Family", BigDecimal.ZERO);
        }
        return defaultFamily;
    }
    
    /**
     * 커스텀 가족 생성
     * 
     * @param name 가족 이름
     * @param monthlyBudget 월 예산 (null이면 0으로 설정)
     * @return 생성된 가족
     */
    public Family createFamily(String name, BigDecimal monthlyBudget) {
        FamilyRepository familyRepository = applicationContext.getBean(FamilyRepository.class);
        FamilyMemberRepository familyMemberRepository = applicationContext.getBean(FamilyMemberRepository.class);
        
        // 가족 생성 (monthlyBudget null이면 0으로 설정)
        Family family = Family.builder()
                .name(name)
                .monthlyBudget(monthlyBudget != null ? monthlyBudget : BigDecimal.ZERO)
                .build();
        family = familyRepository.save(family);
        
        // 가족 멤버 자동 추가 (활성 상태)
        FamilyMember member = FamilyMember.builder()
                .uuid(CustomUuid.generate())
                .familyUuid(family.getUuid())
                .userUuid(user.getUuid())
                .status(FamilyMemberStatus.ACTIVE)
                .build();
        familyMemberRepository.save(member);
        
        // 캐시에 저장
        familyCache.put(name, family);
        
        return family;
    }
    
    /**
     * 기본 테스트 카테고리 반환 (없으면 자동 생성)
     * 
     * - 카테고리명: "Test Category"
     * - 색상: #6366f1
     * - 아이콘: 🏷️
     * - 소속: 기본 가족
     */
    public Category getCategory() {
        if (defaultCategory == null) {
            Family family = getFamily(); // 기본 가족 사용
            defaultCategory = createCategory(family, "Test Category", "#6366f1", "🏷️");
        }
        return defaultCategory;
    }
    
    /**
     * 특정 가족의 기본 카테고리 반환 (없으면 자동 생성)
     * 
     * @param family 카테고리가 속할 가족
     * @return 해당 가족의 기본 카테고리
     */
    public Category getCategory(Family family) {
        String cacheKey = "default-" + family.getUuid().getValue();
        Category cached = categoryCache.get(cacheKey);
        if (cached == null) {
            cached = createCategory(family, "Test Category", "#6366f1", "🏷️");
        }
        return cached;
    }
    
    /**
     * 커스텀 카테고리 생성
     * 
     * @param family 카테고리가 속할 가족
     * @param name 카테고리 이름
     * @param color 색상 (hex code)
     * @param icon 아이콘 이모지
     * @return 생성된 카테고리
     */
    public Category createCategory(Family family, String name, String color, String icon) {
        CategoryRepository categoryRepository = applicationContext.getBean(CategoryRepository.class);
        
        Category category = Category.builder()
                .familyUuid(family.getUuid())
                .name(name)
                .color(color)
                .icon(icon)
                .build();
        category = categoryRepository.save(category);
        
        // 캐시에 저장
        String cacheKey = family.getUuid().getValue() + "-" + name;
        categoryCache.put(cacheKey, category);
        
        return category;
    }
}

