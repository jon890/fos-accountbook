/**
 * Family Service 레이어
 */

import { IFamilyRepository, FamilyWithDetails, CreateFamilyData } from '@/repositories/interfaces/family.repository'

export class FamilyService {
  constructor(private familyRepository: IFamilyRepository) {}

  async getFamilyByUserId(userId: string): Promise<FamilyWithDetails | null> {
    return await this.familyRepository.findByUserId(userId)
  }

  async getAllFamiliesByUserId(userId: string): Promise<FamilyWithDetails[]> {
    return await this.familyRepository.findAllByUserId(userId)
  }

  async getFamilyWithDetails(id: string): Promise<FamilyWithDetails | null> {
    return await this.familyRepository.findWithDetails(id)
  }

  async createFamily(data: CreateFamilyData): Promise<FamilyWithDetails> {
    const family = await this.familyRepository.create(data)
    
    // 생성된 가족의 상세 정보를 다시 조회
    const familyWithDetails = await this.familyRepository.findWithDetails(family.id)
    if (!familyWithDetails) {
      throw new Error('Failed to retrieve created family details')
    }
    
    return familyWithDetails
  }

  async getOrCreateDefaultFamily(userId: string, userName: string | null): Promise<FamilyWithDetails> {
    // 기존 가족 찾기
    let family = await this.familyRepository.findByUserId(userId)
    
    // 없으면 기본 가족 생성
    if (!family) {
      const familyData: CreateFamilyData = {
        name: `${userName || 'My'} Family`,
        userId
      }
      family = await this.createFamily(familyData)
    }
    
    return family
  }

  async checkMembership(familyId: string, userId: string): Promise<boolean> {
    return await this.familyRepository.isMember(familyId, userId)
  }

  async checkAdminRole(familyId: string, userId: string): Promise<boolean> {
    return await this.familyRepository.isAdmin(familyId, userId)
  }

  async addMember(familyId: string, userId: string, role: string = 'member'): Promise<boolean> {
    // 관리자 권한 확인은 컨트롤러에서 수행
    return await this.familyRepository.addMember(familyId, userId, role)
  }

  async removeMember(familyId: string, userId: string): Promise<boolean> {
    return await this.familyRepository.removeMember(familyId, userId)
  }

  async updateMemberRole(familyId: string, userId: string, role: string): Promise<boolean> {
    return await this.familyRepository.updateMemberRole(familyId, userId, role)
  }

  async deleteFamily(familyId: string): Promise<boolean> {
    return await this.familyRepository.softDelete(familyId)
  }
}
