# LeetHub

A Chrome extension (Manifest V3) that automatically commits your accepted LeetCode solutions to a GitHub repository — no manual copy-paste, no clicking through a popup.

## What it does

- Watches the problem page while you work. When a submission comes back **Accepted**, it commits automatically.
- Pulls the solution code, language, difficulty, tags, and the full problem statement from LeetCode's own submission/question data.
- Creates one folder per problem (`<number>-<slug>/`) containing the solution, the question as Markdown, and a blank notes file for your own approach/complexity write-up — and keeps a progress table in your repo's root `README.md` up to date.
- Skips committing if you resubmit an identical accepted solution.

## Installation (unpacked, no build step)

1. Download or clone this repository.
2. Open `chrome://extensions` (also works in Brave, Opera GX, Edge — any Chromium browser).
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the folder you downloaded.
5. The LeetHub icon should appear in your extensions toolbar.

## Connecting GitHub

Click the LeetHub icon → **Open Settings**. You have two ways to connect:

### Option A — Sign in with GitHub (recommended)

This uses GitHub's OAuth Device Flow: no password or token to copy, and the extension never sees your GitHub password.

If you're setting this extension up for yourself from source, you need to register a free OAuth App once:

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**.
2. Fill in any Homepage URL and Authorization callback URL (e.g. your fork's repo URL — device flow doesn't use the callback, but GitHub requires the field).
3. After creating the app, open its settings and check **"Enable Device Flow."**
4. Copy the **Client ID** (not the secret — device flow never needs a secret).
5. Paste it into `lib/config.js` as `GITHUB_CLIENT_ID`.

Then in the extension's Settings page, click **Connect with GitHub**, enter the code shown at the GitHub page that opens, and you're connected.

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

0.1.0 — Manifest V3 rewrite.

### Special Mentions

[Wahaj Javed Alam](https://github.com/WahajJaved20)
