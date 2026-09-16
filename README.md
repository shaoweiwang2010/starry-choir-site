# Starry SATB Choir — deployment guide

## Files
- `index.html` — public site (About, voice parts, updates, member area, join form)
- `admin.html` — admin panel (not linked from the public site; keep the URL private)
- `shared.js` — shared login/GitHub helper code used by both pages
- `logo.png` — your choir logo
- `updates.json` — public "recent updates" posts
- `users.json` — login accounts (usernames + salted/hashed passwords, no plaintext)
- `resources.json` — member-only materials list

## 1. Deploy to GitHub Pages
1. Create a new GitHub repo (public or private both work).
2. Upload all seven files above to the repo root.
3. In the repo, go to **Settings → Pages**, set Source to your default branch, and save.
4. Your site will be live at `https://<username>.github.io/<repo>/` within a minute or two.

## 2. First login
- Admin URL: `https://<username>.github.io/<repo>/admin.html`
- Username: `admin`
- Password: `ufk6L5eWjgV9`

**Change this password immediately** — ask me to regenerate `users.json` with your own username/password any time, or add a new admin account from the Members tab and remove this seed one.

## 3. Connect the admin panel to GitHub
The admin panel edits your data by committing directly to this repo, so after logging in it asks you to connect:
1. **GitHub username/org**: your GitHub username
2. **Repository name**: the repo you created in step 1
3. **Branch**: usually `main`
4. **Personal access token**: create one at GitHub → Settings → Developer settings → **Fine-grained tokens** → New token → limit it to this one repository → permission **Contents: Read and write** only.

The token is stored only in that browser tab's session storage — it is never written into the repo, and it disappears when you close the tab (you'll re-enter it next time).

## 4. Using the admin panel
- **Updates** tab — post/edit/delete the "recent updates" shown on the public site.
- **Members** tab — add member or admin accounts (you set their initial password and give it to them directly).
- **Materials** tab — upload files (sheet music, recordings, etc.) for the member area; they're committed into a `resources/` folder in the repo.

Every save here is a real GitHub commit. The public site reflects it once GitHub Pages finishes redeploying (usually under two minutes; refresh to see it).

## Important limitations, please read
- **GitHub Pages is 100% static hosting — there is no real server.** The "member login" and admin login are checked entirely in the visitor's browser against `users.json`. This keeps out casual visitors, but it is **not real security**: `users.json` and everything in `resources/` are technically public files that a determined person could fetch directly by URL even without logging in.
- **Don't put anything genuinely sensitive** in `resources.json`/`resources/` (personal data, financial info, private recordings you wouldn't want public). It's fine for things like sheet music or rehearsal notes meant for the choir community.
- Deleting a resource entry removes it from the list but leaves the uploaded file sitting in the repo's `resources/` folder — let me know if you'd like deletion to remove the file too.
