# DNS and email - step by step for Guy

_Written 23 Aug 2026. Domain is at **GoDaddy**, registered today, currently showing
GoDaddy's parking page._

## The one complication, explained

Railway needs a **CNAME** record on your root domain (`lunair-world.com`).
**GoDaddy does not allow CNAME records on a root domain** - it's a limitation of their
DNS product, not something you've done wrong. The `www` version works fine there; only
the root is a problem.

So there are two routes. Route A is 10 minutes and gets `www.lunair-world.com` working
now. Route B is about 25 minutes and makes both the root and `www` work properly.
**Route B is the one I recommend**, because your ads and business cards will say
`lunair-world.com` without the `www`, and you'll want clean DNS for email anyway.

---

# Route B (recommended): move DNS to Cloudflare

Cloudflare is free, and it supports root-domain CNAMEs. You keep the domain at GoDaddy -
only the DNS hosting moves.

### Step 1 - Create a Cloudflare account
1. Go to **dash.cloudflare.com/sign-up** and create a free account.
2. Verify your email.

### Step 2 - Add the domain
1. Click **Add a domain**.
2. Enter `lunair-world.com`. Do not include www or https.
3. Choose the **Free** plan and continue.
4. Cloudflare scans existing records. There will be almost nothing - that's expected
   for a fresh domain. Continue.

### Step 3 - Cloudflare shows you two nameservers
They look like `xxx.ns.cloudflare.com` and `yyy.ns.cloudflare.com`.
**Leave this tab open** - you need them in the next step.

### Step 4 - Point GoDaddy at Cloudflare
1. Go to **godaddy.com** → sign in → **My Products**.
2. Find `lunair-world.com` → click **DNS** (or the three dots → Manage DNS).
3. Scroll to **Nameservers** → click **Change**.
4. Choose **I'll use my own nameservers** (sometimes called "Custom").
5. Delete what's there and enter the two Cloudflare nameservers.
6. Save. GoDaddy will warn you this changes where DNS is managed - that's the point.

This takes anywhere from a few minutes to a few hours to take effect. Cloudflare
emails you when it's active.

### Step 5 - Add the website records in Cloudflare
In Cloudflare → your domain → **DNS** → **Records** → **Add record**, twice:

| Type | Name | Target | Proxy status |
|---|---|---|---|
| CNAME | `@` | `3zheie3l.up.railway.app` | **DNS only** (grey cloud) |
| CNAME | `www` | `rl5zyve5.up.railway.app` | **DNS only** (grey cloud) |

**The grey cloud matters.** Cloudflare defaults to an orange cloud ("Proxied"), which
breaks Railway's certificate issuing. Click the cloud icon to turn it grey before saving.
You can turn proxying on later once the certificate exists, but leave it off for now.

### Step 6 - Tell me
Message me once the records are in. I'll confirm Railway sees them and that HTTPS
has been issued. Nothing else is needed from you for the website.

---

# Route A (fast alternative): stay on GoDaddy, www only

Use this if you want something live in ten minutes and are happy for the site to be at
`www.lunair-world.com`.

1. GoDaddy → **My Products** → `lunair-world.com` → **DNS**.
2. **Add New Record**: Type `CNAME`, Name `www`, Value `rl5zyve5.up.railway.app`,
   TTL default. Save.
3. Delete the parked-page records: any **A record with Name `@`** pointing at a GoDaddy
   IP, and the `CNAME www` pointing to `@` if present.
4. For the root, use GoDaddy's **Forwarding**: Domain → Forwarding → Add →
   forward `lunair-world.com` to `https://www.lunair-world.com`, type **Permanent (301)**,
   with **Forward with masking OFF**.

This works, but the root is an HTTP redirect through GoDaddy rather than the site
itself. Fine short-term, worth upgrading to Route B later.

---

# Email (Resend)

Do this **after** DNS settles, and add the records wherever DNS now lives (Cloudflare if
you did Route B, GoDaddy if Route A).

### Step 1 - Get the API key to me
1. Go to **resend.com** → sign in → **API Keys** (left sidebar).
2. Click **Create API Key**.
3. Name: `lunair-production`. Permission: **Full access**. Domain: **All domains**.
4. Copy the key - it starts with `re_` and is shown only once.
5. **Send it to me.** I'll add it to Railway and magic-link sign-in starts reaching
   real inboxes instead of the server log.

### Step 2 - Add the sending domain
1. In Resend → **Domains** → **Add Domain**.
2. Enter exactly: **`mail.lunair-world.com`**
   Not the root domain. A subdomain keeps your main domain's reputation safe if a
   campaign ever goes wrong.
3. Choose the region closest to your customers - **US East** for US sellers.
4. Resend now shows a table of DNS records: usually one **MX**, one **TXT** for SPF,
   and one **TXT** for DKIM (the DKIM value is very long).

### Step 3 - Copy those records into your DNS
Add each one exactly as Resend shows it. Two things people get wrong:

- **The host/name field.** If Resend shows `send.mail` and your DNS provider already
  appends the domain, enter just `send.mail`, not `send.mail.lunair-world.com`. GoDaddy
  and Cloudflare both append it automatically - if you type the full domain you end up
  with `send.mail.lunair-world.com.lunair-world.com`.
- **In Cloudflare, set every one of these to "DNS only" (grey cloud).** Proxying email
  records breaks them.

### Step 4 - Verify
Back in Resend, click **Verify DNS Records**. It can take a few minutes. Green ticks
mean done. If something stays red after 30 minutes, send me a screenshot and I'll work
out which record is off.

### Step 5 - One more record I'll ask for later
Once Resend is verified I'll give you a **DMARC** record to add. It tells inbox
providers what to do with mail that fails the checks above, and it materially improves
whether our alerts land in the inbox rather than spam. Small record, real effect.

---

## What is already done, so you don't redo it

- Both `lunair-world.com` and `www.lunair-world.com` are registered as custom domains on
  the Railway service. Once DNS points at Railway, TLS is issued automatically.
- The site is live and working right now at
  **https://lunair-rader-production.up.railway.app** - that URL keeps working whatever
  you do with DNS, so nothing is at risk while you make these changes.
