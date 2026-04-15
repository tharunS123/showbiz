export class CatalogError extends Error {
  status: number;
  context: Record<string, unknown>;

  constructor(
    message: string,
    opts: { status?: number; [key: string]: unknown } = {}
  ) {
    super(message);
    this.name = "CatalogError";
    this.status = opts.status as number ?? 500;
    this.context = opts;
  }
}

export class ValidationError extends Error {
  fields: Record<string, string[]>;

  constructor(message: string, fields: Record<string, string[]> = {}) {
    super(message);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class AuthError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthError";
  }
}
