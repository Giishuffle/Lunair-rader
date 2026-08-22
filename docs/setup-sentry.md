# Sentry setup - step by step

Sentry catches errors in the running product and tells us before a customer does.
You've created the account and connected the GitHub repo, which is the hard part. What's
left is one string called the **DSN** - the address our code sends errors to.

## What you do (2 minutes)

1. Go to **sentry.io** and sign in.
2. In the left sidebar click **Settings** (the gear).
3. Click **Projects**, then click your Lunair project. If no project exists yet, click
   **Create Project**, choose **Next.js** as the platform, name it `lunair-web`, and
   finish - the DSN appears on the very next screen.
4. In the project's left menu, click **Client Keys (DSN)**.
5. Copy the string next to **DSN**. It looks like:
   `https://a1b2c3d4e5f6@o123456.ingest.us.sentry.io/7890123`
6. Send it to me, or paste it into `.env.local` yourself on the line `SENTRY_DSN=`.

**Is the DSN a secret?** Not really - it's designed to sit in browser code, and it only
allows *sending* errors, never reading them. Sharing it is low risk. The one that is
secret is the **auth token**, which we only need later for uploading source maps; I'll
ask for that separately when we set up deploys.

## What I do with it

- Wire Sentry into both the website and the background worker so any crash, failed
  watcher, or broken government feed is captured with a full stack trace.
- Filter out the noise (bot traffic, cancelled requests) so alerts stay meaningful.
- Scrub personal data from error reports before they leave our servers.
- Connect it to the ops watchdog, so a spike in errors also pings your Telegram.

## Two settings worth changing while you're in there

- **Alerts** → set your email so Sentry notifies you directly, not only me.
- **Projects** → create a second project called `lunair-worker` if you want website and
  background errors separated. Optional; one project is fine to start.
