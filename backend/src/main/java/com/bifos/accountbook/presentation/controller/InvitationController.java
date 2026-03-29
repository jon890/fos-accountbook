package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.invitation.AcceptInvitationRequest;
import com.bifos.accountbook.application.dto.invitation.CreateInvitationRequest;
import com.bifos.accountbook.application.dto.invitation.InvitationResponse;
import com.bifos.accountbook.application.service.InvitationService;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import com.bifos.accountbook.presentation.dto.LoginUserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "초대 (Invitation)", description = "가족 구성원 초대 관리 API")
@Slf4j
@RestController
@RequestMapping("/api/v1/invitations")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class InvitationController {

  private final InvitationService invitationService;

  @Operation(summary = "초대장 생성", description = "가족 구성원 초대장을 생성합니다.")
  @ApiResponse(responseCode = "201", description = "생성 성공")
  @ApiResponse(responseCode = "403", description = "접근 권한 없음")
  @PostMapping("/families/{familyUuid}")
  public ResponseEntity<ApiSuccessResponse<InvitationResponse>> createInvitation(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid,
      @Valid @RequestBody(required = false) CreateInvitationRequest request) {
    log.info("Creating invitation for family: {} by user: {}", familyUuid.getValue(), loginUser.userUuid());

    if (request == null) {
      request = new CreateInvitationRequest(72); // 기본 3일
    }

    InvitationResponse response = invitationService.createInvitation(loginUser.userUuid(), familyUuid, request);

    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiSuccessResponse.of("초대장이 생성되었습니다", response));
  }

  @Operation(summary = "초대장 목록 조회", description = "가족의 활성 초대장 목록을 조회합니다.")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @GetMapping("/families/{familyUuid}")
  public ResponseEntity<ApiSuccessResponse<List<InvitationResponse>>> getFamilyInvitations(
      @LoginUser LoginUserDto loginUser,
      @Parameter(description = "가족 UUID") @PathVariable CustomUuid familyUuid) {
    log.info("Fetching invitations for family: {} by user: {}", familyUuid.getValue(), loginUser.userUuid());

    List<InvitationResponse> invitations = invitationService.getFamilyInvitations(loginUser.userUuid(),
                                                                                  familyUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of(invitations));
  }

  @Operation(summary = "초대장 토큰 조회 (공개)", description = "토큰으로 초대장 정보를 조회합니다. (공개 API — 인증 불필요)")
  @ApiResponse(responseCode = "200", description = "조회 성공")
  @ApiResponse(responseCode = "404", description = "초대장을 찾을 수 없음")
  @SecurityRequirements({})
  @GetMapping("/token/{token}")
  public ResponseEntity<ApiSuccessResponse<InvitationResponse>> getInvitationByToken(
      @PathVariable String token) {
    log.info("Fetching invitation by token: {}...", token.substring(0, Math.min(8, token.length())));

    InvitationResponse invitation = invitationService.getInvitationByToken(token);

    return ResponseEntity.ok(ApiSuccessResponse.of(invitation));
  }

  @Operation(summary = "초대 수락", description = "초대장 토큰으로 초대를 수락합니다.")
  @ApiResponse(responseCode = "200", description = "수락 성공")
  @ApiResponse(responseCode = "400", description = "잘못된 요청")
  @ApiResponse(responseCode = "404", description = "초대장을 찾을 수 없음")
  @PostMapping("/accept")
  public ResponseEntity<ApiSuccessResponse<Void>> acceptInvitation(
      @LoginUser LoginUserDto loginUser,
      @Valid @RequestBody AcceptInvitationRequest request) {
    String token = request.getToken();
    log.info("User: {} accepting invitation with token: {}...", loginUser.userUuid(), token.substring(0, Math.min(8, token.length())));

    invitationService.acceptInvitation(loginUser.userUuid(), token);

    return ResponseEntity.ok(ApiSuccessResponse.of("초대를 수락했습니다. 가족에 가입되었습니다.", null));
  }

  @Operation(summary = "초대장 삭제", description = "초대장을 삭제합니다.")
  @ApiResponse(responseCode = "200", description = "삭제 성공")
  @ApiResponse(responseCode = "403", description = "접근 권한 없음")
  @ApiResponse(responseCode = "404", description = "초대장을 찾을 수 없음")
  @DeleteMapping("/{invitationUuid}")
  public ResponseEntity<ApiSuccessResponse<Void>> deleteInvitation(
      @LoginUser LoginUserDto loginUser,
      @PathVariable String invitationUuid) {
    log.info("Deleting invitation: {} by user: {}", invitationUuid, loginUser.userUuid());

    invitationService.deleteInvitation(loginUser.userUuid(), invitationUuid);

    return ResponseEntity.ok(ApiSuccessResponse.of("초대장이 삭제되었습니다", null));
  }
}
