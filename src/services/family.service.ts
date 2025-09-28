/**
 * Family Service 레이어
 */

import {
  IFamilyRepository,
  FamilyWithDetails,
  CreateFamilyData,
} from "@/repositories/interfaces/family.repository";
import { IUserRepository } from "@/repositories/interfaces/user.repository";

export class FamilyService {
  constructor(
    private familyRepository: IFamilyRepository,
    private userRepository: IUserRepository
  ) {}

  async getFamilyByUserId(userId: string): Promise<FamilyWithDetails | null> {
    // userId는 User.authId이므로, 먼저 User.uuid를 찾음
    const user = await this.userRepository.findByAuthId(userId);
    if (!user) return null;

    return await this.familyRepository.findByUserUuid(user.uuid);
  }

  async getAllFamiliesByUserId(userId: string): Promise<FamilyWithDetails[]> {
    // userId는 User.authId이므로, 먼저 User.uuid를 찾음
    const user = await this.userRepository.findByAuthId(userId);
    if (!user) return [];

    return await this.familyRepository.findAllByUserUuid(user.uuid);
  }

  async getFamilyWithDetails(id: string): Promise<FamilyWithDetails | null> {
    return await this.familyRepository.findWithDetails(id);
  }

  async createFamily(data: CreateFamilyData): Promise<FamilyWithDetails> {
    // userId는 User.authId이므로, 먼저 User.uuid를 찾음
    const user = await this.userRepository.findByAuthId(data.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Family 생성 (사용자 정보 제외)
    const family = await this.familyRepository.create(data);

    // 생성된 Family에 첫 번째 멤버로 사용자 추가 (admin 권한)
    await this.familyRepository.addMember(family.uuid, user.uuid, "admin");

    // 생성된 가족의 상세 정보를 다시 조회
    const familyWithDetails = await this.familyRepository.findWithDetails(
      family.id
    );
    if (!familyWithDetails) {
      throw new Error("Failed to retrieve created family details");
    }

    return familyWithDetails;
  }

  async getOrCreateDefaultFamily(
    userId: string,
    userName: string | null
  ): Promise<FamilyWithDetails> {
    // 기존 가족 찾기
    let family = await this.getFamilyByUserId(userId);

    // 없으면 기본 가족 생성
    if (!family) {
      const familyData: CreateFamilyData = {
        name: `${userName || "My"} Family`,
        userId,
      };
      family = await this.createFamily(familyData);
    }

    return family;
  }

  async checkMembership(familyId: string, userId: string): Promise<boolean> {
    // userId는 User.authId이므로, 먼저 User.uuid를 찾음
    const user = await this.userRepository.findByAuthId(userId);
    if (!user) return false;

    return await this.familyRepository.isMember(familyId, user.uuid);
  }

  async checkAdminRole(familyId: string, userId: string): Promise<boolean> {
    // userId는 User.authId이므로, 먼저 User.uuid를 찾음
    const user = await this.userRepository.findByAuthId(userId);
    if (!user) return false;

    return await this.familyRepository.isAdmin(familyId, user.uuid);
  }

  async addMember(
    familyId: string,
    userId: string,
    role: string = "member"
  ): Promise<boolean> {
    // userId는 User.authId이므로, 먼저 User.uuid를 찾음
    const user = await this.userRepository.findByAuthId(userId);
    if (!user) return false;

    return await this.familyRepository.addMember(familyId, user.uuid, role);
  }

  async removeMember(familyId: string, userId: string): Promise<boolean> {
    // userId는 User.authId이므로, 먼저 User.uuid를 찾음
    const user = await this.userRepository.findByAuthId(userId);
    if (!user) return false;

    return await this.familyRepository.removeMember(familyId, user.uuid);
  }

  async updateMemberRole(
    familyId: string,
    userId: string,
    role: string
  ): Promise<boolean> {
    // userId는 User.authId이므로, 먼저 User.uuid를 찾음
    const user = await this.userRepository.findByAuthId(userId);
    if (!user) return false;

    return await this.familyRepository.updateMemberRole(
      familyId,
      user.uuid,
      role
    );
  }

  async deleteFamily(familyId: string): Promise<boolean> {
    return await this.familyRepository.softDelete(familyId);
  }
}
