export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export function notFound(message = "Resource not found") {
  return new AppError(404, "not_found", message);
}

export function badRequest(message: string, code = "bad_request") {
  return new AppError(400, code, message);
}
