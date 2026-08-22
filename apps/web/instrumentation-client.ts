import * as Sentry from "@sentry/nextjs";
import { sharedSentryOptions } from "./sentry.shared";

if (sharedSentryOptions.dsn) {
  Sentry.init({
    ...sharedSentryOptions,
    // Session replay is off: sellers' product data would be recorded on screen.
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
