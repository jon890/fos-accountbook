/**
 * CodeEnum 추상 클래스
 * 모든 enum은 code 값을 가지고, DB와의 매핑을 자동화
 */
export abstract class CodeEnum {
  constructor(public readonly code: string, public readonly name: string) {}

  toString(): string {
    return this.code;
  }

  equals(other: CodeEnum): boolean {
    return this.code === other.code;
  }

  static fromCode<T extends CodeEnum>(
    enumClass: Record<string, T>,
    code: string
  ): T {
    const values = Object.values(enumClass) as T[];
    const found = values.find((value) => value.code === code);
    if (!found) {
      throw new Error(`Invalid code: ${code} for enum`);
    }
    return found;
  }

  static getAllCodes<T extends CodeEnum>(
    enumClass: Record<string, T>
  ): string[] {
    return Object.values(enumClass).map((value: T) => value.code);
  }

  static getAllValues<T extends CodeEnum>(enumClass: Record<string, T>): T[] {
    return Object.values(enumClass) as T[];
  }
}

/**
 * CodeEnum을 위한 유틸리티 타입
 */
export type CodeEnumType<T extends CodeEnum> = {
  new (code: string, name: string): T;
  fromCode(code: string): T;
  getAllCodes(): string[];
  getAllValues(): T[];
};
