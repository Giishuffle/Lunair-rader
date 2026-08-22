import * as Sentry from "@sentry/nextjs";
import { sharedSentryOptions } from "./sentry.shared";

export async function register() {
  if (!sharedSentryOptions.dsn) return;
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(sharedSentryOptions);
  }
}

export const onRequestError = Sentry.captureRequestError;
