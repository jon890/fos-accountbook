/**
 * Family Repository 인터페이스
 */

import { BaseRepository } from "./base.repository";

export interface FamilyData {
  id: string;
  uuid: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface FamilyWithDetails extends FamilyData {
  members: Array<{
    id: string;
    role: string;
    joinedAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }>;
  categories: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
  }>;
  _count?: {
    expenses: number;
  };
}

export interface CreateFamilyData {
  name: string;
  userId: string;
  type?: "personal" | "family";
  categories?: Array<{
    name: string;
    color: string;
    icon: string;
  }>;
}

export interface UpdateFamilyData {
  name?: string;
}

export interface IFamilyRepository
  extends BaseRepository<FamilyData, CreateFamilyData, UpdateFamilyData> {
  // Family 특화 메서드
  findByUserUuid(userUuid: string): Promise<FamilyWithDetails | null>;
  findAllByUserUuid(userUuid: string): Promise<FamilyWithDetails[]>;
  findWithDetails(id: string): Promise<FamilyWithDetails | null>;
  findByUuid(uuid: string): Promise<FamilyWithDetails | null>;
  addMember(
    familyId: string,
    userUuid: string,
    role?: string
  ): Promise<boolean>;
  removeMember(familyId: string, userUuid: string): Promise<boolean>;
  updateMemberRole(
    familyId: string,
    userUuid: string,
    role: string
  ): Promise<boolean>;
  isMember(familyId: string, userUuid: string): Promise<boolean>;
  isAdmin(familyId: string, userUuid: string): Promise<boolean>;
}
