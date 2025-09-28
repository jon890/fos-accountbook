/**
 * User Repository 인터페이스
 */

import { BaseRepository } from "./base.repository";

export interface UserData {
  id: string;
  uuid: string;
  authId: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateUserData {
  authId: string;
  name?: string;
  email: string;
  emailVerified?: Date;
  image?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  emailVerified?: Date;
  image?: string;
}

export interface IUserRepository
  extends BaseRepository<UserData, CreateUserData, UpdateUserData> {
  // User 특화 메서드
  findByAuthId(authId: string): Promise<UserData | null>;
  findByUuid(uuid: string): Promise<UserData | null>;
  findByEmail(email: string): Promise<UserData | null>;

  // 유틸리티 메서드
  existsByEmail(email: string): Promise<boolean>;
  existsByAuthId(authId: string): Promise<boolean>;
}
