import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Keeps the Supabase session fresh: when the access token has expired,
 * getUser() refreshes it and the new cookies go out with this response.
 * Server components can't write cookies, so this has to happen here.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Skip the network call for visitors who have never signed in.
  if (!url || !key || !request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Pages and API routes only; not static files, images or the paper PDFs.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|papers/cs/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|pdf)$).*)"],
};
