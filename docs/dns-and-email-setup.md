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

# GoDaddy setup - what to do now (chosen 23 Aug 2026)

Staying on GoDaddy for now, so **`www.lunair-world.com` is the real address** and the
bare root redirects to it. Cloudflare can come later; nothing here has to be undone.

Your DNS as it stands today:
- root `@` -> two A records pointing at GoDaddy's parking page
- `www` -> a CNAME pointing back at the root (GoDaddy's default)
- MX records for GoDaddy email, which we leave alone

## Change 1 - point www at Railway (this is an edit, not a new record)

1. **godaddy.com** -> sign in -> **My Products**.
2. Next to `lunair-world.com`, click **DNS** (or the three dots -> **Manage DNS**).
3. Find the existing row: **Type `CNAME`, Name `www`, Value `@`**.
4. Click the **pencil/edit** icon on that row.
5. Change **Value** to exactly:
   ```
   rl5zyve5.up.railway.app
   ```
   Leave Name as `www`. Leave TTL as-is (1 hour is fine).
6. **Save**.

Do not add a second `www` record - GoDaddy allows only one CNAME per name, and a
duplicate will either be refused or silently win over the right one.

## Change 2 - forward the root to www

1. Still in GoDaddy, on the same domain page, find **Forwarding**
   (under the Domain tab, sometimes labelled "Domain Forwarding").
2. Click **Add Forwarding**.
3. Fill in:
   - **Forward to:** `https://www.lunair-world.com`
   - **Forward type:** **Permanent (301)**
   - **Settings:** **Forward only** - masking **OFF**
4. Save. GoDaddy replaces the parked A records on the root by itself; you do not need
   to delete them manually.

Masking must stay off. It keeps the old address in the browser bar and hides the real
site inside a frame, which breaks sign-in and looks broken to Google.

## Then tell me

Message me once both are saved. I will confirm Railway sees the record and that the
HTTPS certificate has been issued, which is automatic but takes a few minutes after
DNS resolves. Propagation is usually 10-30 minutes on GoDaddy, occasionally longer.

## Worth knowing

- The Railway custom domain for the bare root stays registered but will sit
  **unverified** until DNS moves to a provider that allows a root CNAME. That is
  expected and harmless - the forward covers it in the meantime.
- The app now treats `https://www.lunair-world.com` as its canonical address, so
  sign-in links and Stripe redirects all point at www.
- `https://lunair-rader-production.up.railway.app` keeps working throughout.

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


---

# Status log

## 23 Aug 2026 - www live, email live

**DNS (done by Guy).** `www.lunair-world.com` CNAME -> `rl5zyve5.up.railway.app`.
Verified authoritative and clean: one record, resolving to Railway's own IP
(69.46.46.70), no CAA records, no stale duplicates.

**The apex custom domain was removed from Railway.** GoDaddy cannot put a CNAME on a
root domain, so it could never validate and was only adding noise. Re-add it when DNS
moves to Cloudflare - the CNAME target will be a new value at that point, so take it
from Railway then rather than reusing `3zheie3l.up.railway.app`.

**Root domain forwarding is still to do.** GoDaddy has a Website Builder site attached
to the root (`A @ -> WebsiteBuilder Site`), which will block Forwarding until that site
is disconnected under My Products -> Website Builder.

**Certificate.** Railway sat at `VALIDATING_OWNERSHIP` for 20+ minutes after
propagation, with no error and nothing wrong on our side. TLS to www already completes
using Railway's `*.up.railway.app` wildcard, so routing works and only the per-domain
certificate is outstanding. It issues by itself; if it is still pending after a couple
of hours, delete and re-add the custom domain in Railway to restart the process.

**Email (Resend).** Guy verified the **root** domain `lunair-world.com` rather than a
`mail.` subdomain - DKIM and SPF both green, region eu-west-1. `EMAIL_FROM` is
therefore `Lunair World <hello@lunair-world.com>`. Verified end to end: the production
app sent a real magic-link sign-in email through Resend.

Worth doing later: move sending to `mail.lunair-world.com`. The root carries GoDaddy MX
records for ordinary mail, so bulk sending from the same domain puts personal email
deliverability and campaign reputation in one basket. Not urgent, but the reason the
subdomain was recommended originally.

Also outstanding: a **DMARC** record, which meaningfully improves inbox placement.
