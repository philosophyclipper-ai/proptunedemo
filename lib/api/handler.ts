import { NextResponse } from "next/server";
import { ApiError, errorBody } from "@/lib/api/errors";

type RouteHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Wraps a route handler so every endpoint gets the same voice-friendly
 * error shape without repeating try/catch boilerplate.
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(errorBody(err), { status: err.status });
      }
      console.error(err);
      return NextResponse.json(
        {
          error: {
            code: "validation_failed",
            message: "Something went wrong processing that request",
          },
        },
        { status: 500 }
      );
    }
  };
}
