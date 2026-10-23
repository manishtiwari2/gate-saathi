import { NextResponse } from "next/server";

/** Consistent JSON success envelope. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** Consistent JSON error envelope. */
export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, data: null, error: { code, message } }, { status });
}

/** Parse ?page / ?pageSize with sane bounds. */
export function parsePagination(searchParams: URLSearchParams, defaultSize = 50) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize")) || defaultSize));
  return { page, pageSize };
}
