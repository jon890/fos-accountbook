package com.bifos.accountbook.contract;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("OpenAPI 스냅샷 추출 테스트")
class OpenApiSnapshotTest {

  private MockMvc mockMvc;

  @Autowired
  private WebApplicationContext context;

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
  }

  @Test
  @DisplayName("OpenAPI 스냅샷을 추출하여 build/openapi-snapshot.json에 저장한다")
  void extractOpenApiSnapshot() throws Exception {
    String json = mockMvc.perform(get("/v3/api-docs"))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.openapi").exists())
        .andExpect(jsonPath("$.paths").exists())
        .andReturn().getResponse().getContentAsString();

    Path output = Path.of("build", "openapi-snapshot.json");
    Files.createDirectories(output.getParent());
    Files.writeString(output, json,
        StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

    String saved = Files.readString(output);
    assertThat(saved)
        .contains("/api/v1/families/{familyUuid}/recurring-expenses");
  }
}
