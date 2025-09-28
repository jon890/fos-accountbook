/**
 * 베이스 Repository 인터페이스
 */

export interface PaginationOptions {
  page: number
  limit: number
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface SortOptions {
  field: string
  order: 'asc' | 'desc'
}

export interface FilterOptions {
  [key: string]: unknown
}

export interface BaseRepository<T, CreateData, UpdateData> {
  // 기본 CRUD
  findById(id: string): Promise<T | null>
  findAll(options?: { 
    pagination?: PaginationOptions
    sort?: SortOptions
    filters?: FilterOptions 
  }): Promise<PaginationResult<T>>
  create(data: CreateData): Promise<T>
  update(id: string, data: UpdateData): Promise<T | null>
  
  // Soft delete
  softDelete(id: string): Promise<boolean>
  restore(id: string): Promise<boolean>
  
  // 유틸리티
  exists(id: string): Promise<boolean>
  count(filters?: FilterOptions): Promise<number>
}
