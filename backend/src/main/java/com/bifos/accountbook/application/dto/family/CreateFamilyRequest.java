package com.bifos.accountbook.application.dto.family;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateFamilyRequest {
    
    @NotBlank(message = "가족 이름은 필수입니다")
    @Size(min = 1, max = 100, message = "가족 이름은 1-100자 사이여야 합니다")
    private String name;
}

