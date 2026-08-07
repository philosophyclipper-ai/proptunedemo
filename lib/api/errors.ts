export type ApiErrorCode =
  | "unauthorized"
  | "not_found"
  | "validation_failed"
  | "conflict"
  | "rate_limited";

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.code = code;
    this.status = statusForCode(code);
  }
}

function statusForCode(code: ApiErrorCode): number {
  switch (code) {
    case "unauthorized":
      return 401;
    case "not_found":
      return 404;
    case "validation_failed":
      return 422;
    case "conflict":
      return 409;
    case "rate_limited":
      return 429;
  }
}

export function errorBody(error: ApiError) {
  return { error: { code: error.code, message: error.message } };
}
