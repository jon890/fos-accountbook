/**
 * 데이터 직렬화 관련 유틸리티
 */

// BigInt 직렬화를 위한 유틸리티
export function serializeBigInt(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'bigint') {
    return obj.toString()
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt)
  }

  if (typeof obj === 'object') {
    const serialized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value)
    }
    return serialized
  }

  return obj
}

// 날짜 객체 직렬화
export function serializeDate(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (obj instanceof Date) {
    return obj.toISOString()
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeDate)
  }

  if (typeof obj === 'object') {
    const serialized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeDate(value)
    }
    return serialized
  }

  return obj
}

// 복합 직렬화 (BigInt + Date)
export function serialize(obj: unknown): unknown {
  return serializeDate(serializeBigInt(obj))
}
