export type ActionResult<T = undefined> =
  | { ok: true; message: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function fail(message: string, fieldErrors?: Record<string, string>) {
  return { ok: false as const, message, fieldErrors };
}

export function done<T>(message: string, data?: T) {
  return { ok: true as const, message, data };
}
