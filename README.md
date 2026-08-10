# LeetHub

**LeetHub** is a free Chrome extension (Manifest V3) that automatically syncs and commits your accepted LeetCode solutions to a GitHub repository — no manual copy-paste, no clicking through a popup. Think of it as **LeetCode to GitHub auto-sync**, built for people tracking their coding interview prep in git.

> Not on the Chrome Web Store. Install it manually in a couple of minutes — see [Installing the extension](#installing-the-extension) below.

## What's new in v2

This is a full rewrite of the original LeetHub, not an incremental update:

- Rebuilt on **Manifest V3** (the old Manifest V2 build no longer runs in current Chrome).
- **Auto-commits on Accepted** — no popup click needed.
- Reads submissions via **LeetCode's GraphQL API** instead of scraping the page, with a DOM fallback.
- **Per-problem folders** (`<number>-<title>/`) with the solution, the full question as Markdown, and a personal `notes.md` that's created once and never overwritten.
- **GitHub OAuth (Device Flow)** sign-in, alongside the original Personal Access Token option.
- A settings page, connection status, auto-updated progress table in your repo's README, a new icon, and a redesigned UI.
- If you used the old (v1) version: storage was reset by this rewrite, so open **Settings** and reconnect once after updating.

## What it does

- Watches the problem page while you work. When a submission comes back **Accepted**, it commits automatically.
- Pulls the solution code, language, difficulty, tags, and the full problem statement from LeetCode's own submission/question data.
- Creates one folder per problem (`<number>-<slug>/`) containing the solution, the question as Markdown, and a blank notes file for your own approach/complexity write-up — and keeps a progress table in your repo's root `README.md` up to date.
- Skips committing if you resubmit an identical accepted solution.

## Installing the extension

This project isn't published on the Chrome Web Store, so it's installed the same way any developer-mode extension is — takes about a minute:

1. **Download the code.** Either clone it —
   ```
   git clone https://github.com/SyedMuhammadFaheem/LeetHub.git
   ```
   — or click the green **Code → Download ZIP** button on the GitHub repo page and unzip it somewhere.
2. Open **`chrome://extensions`** in your address bar (also works in any Chromium browser — Brave, Edge, Opera GX).
3. Turn on **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked**.
5. Select the folder you cloned/unzipped (the one containing `manifest.json`).
6. The LeetHub icon appears in your browser toolbar — pin it for easy access (puzzle-piece icon → pin).

**Updating later**: pull the latest changes (or re-download the ZIP) into the same folder, then go back to `chrome://extensions` and click the reload icon (⟳) on the LeetHub card.

## Connecting GitHub

Click the LeetHub icon → **Open Settings**. You have two ways to connect:

### Option A — Sign in with GitHub (recommended)

This uses GitHub's OAuth Device Flow: no password or token to copy, and the extension never sees your GitHub password. It works out of the box — just open the extension's Settings page, click **Connect with GitHub**, and enter the code shown at the GitHub page that opens.

<details>
<summary>Forking this project and want your own OAuth App instead of the shared one?</summary>

`lib/config.js` ships with a `GITHUB_CLIENT_ID` already registered for this project. If you fork the repo and want authorizations to show up under your own app identity instead:

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**.
2. Fill in any Homepage URL and Authorization callback URL (device flow doesn't use the callback, but GitHub requires the field).
3. Open the new app's settings and check **"Enable Device Flow."**
4. Copy the **Client ID** (not the secret — device flow never needs one) and paste it into `lib/config.js`.

</details>

### Option B — Personal Access Token

1. On GitHub, go to **Settings → Developer settings → Personal access tokens (Fine-grained)**.
2. Generate a token scoped to the one repository you want LeetHub to commit to, with **Contents: Read and write** permission only.
3. Paste it into the Settings page's token field and save.

Either way, also set your **GitHub Owner** (your username or an org) and **Repository Name** in Settings — this is where solutions get committed.

## Using it

Just solve problems on LeetCode normally. When a submission is Accepted, LeetHub commits it in the background and shows a small toast confirming the commit. Open the popup any time to see connection status or trigger a manual commit if auto-detection ever misses a result.

## Repository layout it creates

```
your-repo/
  README.md              # auto-updated progress table (# | problem | difficulty | solved)
  1-two-sum/
    solution.py           # refreshed on every accepted (re)submission
    question.md            # full problem statement — created once, never rewritten
    notes.md                # blank Approach/Complexity scaffold — created once, never rewritten
  2-add-two-numbers/
    solution.js
    question.md
    notes.md
```

`question.md` and `notes.md` are only ever *created*, never overwritten — LeetHub checks whether they already exist before touching them, so anything you write in `notes.md` (or hand-edit in `question.md`) survives every future resubmission of that problem. Only `solution.<ext>` updates each time you resubmit an accepted solution.

## Development

No build step — plain JS/HTML/CSS, loaded directly by the browser.

- Run tests: `node --test`
- Syntax-check: `find . -name "*.js" -not -path "./node_modules/*" -print0 | xargs -0 -n1 node --check`
- CI runs both on every push via `.github/workflows/ci.yml`.

## Version

2.0.0 — v2, full Manifest V3 rewrite.

### Special Mentions

[Wahaj Javed Alam](https://github.com/WahajJaved20)
