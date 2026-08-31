import { NextResponse, type NextRequest } from "next/server";

// Everything except /api/v1/* and /api/cron/* sits behind HTTP Basic Auth —
// this is a demo CRM with no real auth system, and the UI isn't meant to be
// public. The API stays on x-api-key only so n8n/Vapi can call it without a
// browser prompt. /api/cron/* is excluded too — Vercel's own cron trigger
// sends `Authorization: Bearer $CRON_SECRET`, not Basic Auth credentials,
// so leaving it behind this gate would make the cron route unreachable by
// the thing that's supposed to call it. The route checks CRON_SECRET itself.
export function proxy(request: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!user || !password) {
    return unauthorized();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const suppliedUser = decoded.slice(0, separatorIndex);
    const suppliedPassword = decoded.slice(separatorIndex + 1);

    if (suppliedUser === user && suppliedPassword === password) {
      return NextResponse.next();
    }
  }

  return unauthorized();
}

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="PropTune Demo CRM"' },
  });
}

export const config = {
  matcher: ["/((?!api/v1|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
