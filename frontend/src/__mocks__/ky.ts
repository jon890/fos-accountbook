/**
 * ky 모듈 Mock (테스트용)
 *
 * Jest에서 ESM 모듈인 ky를 테스트하기 위한 mock 파일입니다.
 * 실제 ky의 인터페이스를 흉내내어 테스트가 정상적으로 동작하도록 합니다.
 */

// Mock Response 생성 헬퍼
const createMockResponse = (data: unknown, status = 200) => ({
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  clone: jest.fn().mockReturnValue({
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  }),
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? "OK" : "Error",
  headers: new Headers({
    "content-type": "application/json",
  }),
});

// Mock ky 인스턴스
const mockKyInstance = {
  get: jest
    .fn()
    .mockImplementation(() => Promise.resolve(createMockResponse({}))),
  post: jest
    .fn()
    .mockImplementation(() => Promise.resolve(createMockResponse({}))),
  put: jest
    .fn()
    .mockImplementation(() => Promise.resolve(createMockResponse({}))),
  delete: jest
    .fn()
    .mockImplementation(() => Promise.resolve(createMockResponse({}))),
  patch: jest
    .fn()
    .mockImplementation(() => Promise.resolve(createMockResponse({}))),
  head: jest
    .fn()
    .mockImplementation(() => Promise.resolve(createMockResponse({}))),
  extend: jest.fn().mockReturnThis(),
};

// ky.create() mock
const create = jest.fn().mockReturnValue(mockKyInstance);

// ky 기본 함수 mock
const ky = Object.assign(
  jest.fn().mockImplementation(() => Promise.resolve(createMockResponse({}))),
  {
    create,
    extend: jest.fn().mockReturnValue(mockKyInstance),
    get: mockKyInstance.get,
    post: mockKyInstance.post,
    put: mockKyInstance.put,
    delete: mockKyInstance.delete,
    patch: mockKyInstance.patch,
    head: mockKyInstance.head,
    stop: Symbol("ky.stop"),
  }
);

// HTTPError mock class
export class HTTPError extends Error {
  response: Response;
  request: Request;
  options: Record<string, unknown>;

  constructor(
    response: Response,
    request: Request = new Request("http://test"),
    options: Record<string, unknown> = {}
  ) {
    super(`Request failed with status code ${response.status}`);
    this.name = "HTTPError";
    this.response = response;
    this.request = request;
    this.options = options;
  }
}

// TimeoutError mock class
export class TimeoutError extends Error {
  request: Request;

  constructor(request: Request = new Request("http://test")) {
    super("Request timed out");
    this.name = "TimeoutError";
    this.request = request;
  }
}

export default ky;
export { ky };
