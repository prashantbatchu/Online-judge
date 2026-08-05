# Online Judge — Full End-to-End Walkthrough

*Based on the actual uploaded codebase (`Online-judge-main.zip`), read file by file.*

This doc is built so you can use it two ways:
1. **To actually run the project locally** (Section 1)
2. **To explain any file confidently in an interview**, in the order you should learn/present them (Section 2 onward)

---

## 1. How to set up and run this project

The repo has no `.env.example` (it's gitignored), so here's the env file you need to create yourself at the project root as `.env.local`, reverse-engineered from every `process.env.X` reference in the code:

```bash
# .env.local

MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<dbname>
JWT_SECRET=some-long-random-secret-string
ADMIN_EMAIL=youradmin@email.com            # server-side check (see Section 6 — currently unused!)
NEXT_PUBLIC_ADMIN_EMAIL=youradmin@email.com # client-side check, shown in Navbar/admin pages
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # used internally by the judging route to call /api/execute
```

Then:

```bash
npm install
npm run dev
# open http://localhost:3000
```

**One external dependency you don't control:** `/api/execute` calls the public hosted Judge0 instance at `https://ce.judge0.com` directly — no API key in this code, no self-hosting. If that public instance is down or rate-limited, code execution and all submissions will fail. Worth knowing before a live demo.

**A note on `NEXT_PUBLIC_BASE_URL`:** the submission-judging route calls `${NEXT_PUBLIC_BASE_URL}/api/execute` internally (a server route calling another server route over HTTP, rather than importing the logic directly as a function) — good to know if asked "why does judging make an HTTP call to your own server."

---

## 2. Recommended order to actually explain this project in an interview

Don't go folder-by-folder alphabetically — that's how you lose the thread. Go in the order a request actually flows:

1. `app/api/models/*.ts` — the data shape, first, always. Schemas are the contract everything else builds on.
2. `app/utils/setCookie.ts` + `app/api/signup/route.ts` + `app/api/login/route.ts` — how a user gets an identity.
3. `app/api/execute/route.ts` — how one piece of code actually runs.
4. `app/api/submissions/create/route.ts` — how a submission becomes a verdict (this is your best file — spend the most time here).
5. `app/problems/[id]/page.tsx` — the page that ties editor + run + submit together; this is "the product" from a user's point of view.
6. Everything else (contests, leaderboard, profile, admin) — same patterns repeated: fetch → useState → render.

---

## 3. Data models (`app/api/models/`) — the contract

### `user.models.ts`
```ts
username: String (required)
email: String (required)
password: String (required, stores bcrypt hash)
```
Simple on purpose. **Note for interviews:** there's no `role` field — so there's no way to distinguish an admin from a regular user *at the data layer*. Admin-gating currently happens entirely by comparing `email` to an env var (see Section 6).

### `problem.models.ts`
```ts
title, description: String (required)
difficulty: enum ["Easy","Medium","Hard"], default "Easy"
tags: [String]
inputFormat, outputFormat, constraints: String (optional)
testCases: [{ input: String, output: String }]   // the hidden judge data
createdAt: Date
```
The `testCases` array is the entire "hidden test data" of the judge — each one is a plain input/output string pair, checked later in the submission route.

### `submission.models.ts`
```ts
user: ObjectId → ref "User"
problem: ObjectId → ref "Problem"
language: enum ["cpp","java","python","javascript"]
code: String
status: enum ["Pending","Accepted","Wrong Answer","TLE","Runtime Error","Compilation Error"], default "Pending"
executionTime: Number (ms)
memory: Number
failedTestCaseIndex: Number | null
timestamps: true   // gives createdAt/updatedAt — this is what streaks/heatmaps are built from
```
This is the most important schema to be able to draw from memory — it's referenced by leaderboard, profile, problems-list "solved" checkmarks, and streaks.

### `contest.models.ts`
```ts
title, description, startTime, endTime
problems: [ObjectId → ref "Problem"]
participants: [ObjectId → ref "User"]
timestamps: true
```
Contests don't store their own leaderboard/scoring — they just group problems and track who registered. Ranking during a contest isn't actually computed anywhere in this codebase (see gaps).

**Design decision to state out loud:** all four models use `ObjectId` references rather than embedding documents into each other. That's the right call here specifically because `Submission` grows unboundedly and needs independent queries like "all submissions by user X" or "all submissions for problem Y" — embedding would make that expensive.

---

## 4. Auth flow (`signup`, `login`, `logout`, `setCookie.ts`)

### `app/utils/setCookie.ts`
```ts
const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
cookieStore.set("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7*24*60*60,
});
```
One function, reused by both signup and login. Signs a JWT containing just the user's Mongo `_id`, sets it as a cookie with three deliberate security flags:
- `httpOnly` → JavaScript in the browser (and therefore an XSS payload) can't read this cookie.
- `sameSite: "strict"` → the cookie won't be sent on cross-site requests, which mitigates CSRF.
- `secure` only in production → allows plain HTTP during local dev, forces HTTPS-only in prod.

### `app/api/signup/route.ts`
Order of operations: validate required fields present → check email not already taken → `bcrypt.hash(password, 10)` → `User.create(...)` → `setCookie(user._id)` → return the created user **with `password: undefined`** stripped out of the response. Also separately catches Mongo's duplicate-key error code `11000` as a backup in case the manual `findOne` check races.

### `app/api/login/route.ts`
Find user by email → `bcrypt.compare(password, user.password)` → `setCookie(user._id)` → strip password from response. Standard, correct pattern.

### `app/api/logout/route.ts`
Just `cookieStore.delete("token")`. Note there's a dead file sitting next to it, `routeold.ts` — an earlier version kept around; harmless, but if an interviewer opens your file tree, be ready to say "that's an old draft I haven't cleaned up yet" rather than being caught off guard.

### An important disconnect to know about: cookie vs. localStorage
The backend sets an httpOnly **cookie** as the actual auth mechanism. But the **frontend** (`Navbar.tsx`, every page that checks "is someone logged in") reads a *separate*, plain `user` object out of `localStorage`, set manually by the login/signup pages right after a successful response (`localStorage.setItem('user', JSON.stringify(result.user))`). 

This means: the cookie is what a server route *would* use to verify identity, but in practice **no server route in this codebase actually reads/verifies that cookie** — every API route trusts a `userId` sent directly in the request body or URL, which the frontend pulls straight out of localStorage. This is a real, honest gap to know before an interviewer asks "so if I edit localStorage in devtools and change my user id, what happens?" (Answer: you'd be able to submit/act as another user — there's no server-side session verification tying requests back to the JWT cookie yet.) Framing for the interview: *"I built the JWT/cookie infrastructure correctly, but I haven't yet wired a middleware layer that verifies the cookie's JWT on protected API routes — right now those routes trust the client-supplied userId. That's the top thing I'd fix before calling this production-ready."* This is a stronger answer than pretending it's already secure.

---

## 5. Code execution (`app/api/execute/route.ts`)

Already covered in depth in your earlier report — quick recap of the exact mechanics:
- Maps `{cpp:54, c:50, python:71, java:62, javascript:63}` → Judge0 language IDs.
- Base64-encodes `code` and `stdin` (Judge0 requires this).
- POSTs to `https://ce.judge0.com/submissions?wait=true&base64_encoded=true` — the `wait=true` flag means Judge0 blocks and returns the result synchronously, rather than you having to poll a submission-token endpoint. That's *why* your own execute route can be a single simple POST instead of a poll loop — worth mentioning, it's a real API design detail.
- Decodes `stdout`/`compile_output`/`stderr` back from base64, prioritizes `compile_output` over `stderr` (compile errors are more informative than a generic stderr dump), and normalizes everything into one clean shape for the rest of the app to consume.

---

## 6. Submission judging (`app/api/submissions/create/route.ts`) — your strongest file

You already have this well-documented from before. One more detail worth adding: **there's a commented-out first version of this function sitting directly above the live one in the file** — the developer's first attempt, before the improved error-precedence and normalization logic was added. If an interviewer scrolls up in this file during a live code review, be ready with: *"That's my first draft — I kept it commented above the final version so I could show the iteration. The first version didn't handle compile-vs-runtime error precedence or whitespace normalization; I added those after hitting real false negatives."* That's a good story, not something to be embarrassed about — genuinely shows iteration.

### `app/api/problems/[id]/route.ts` — a quirky but interesting design choice
```ts
const problem = await problemModels.find({}).sort({ createdAt: -1 }).skip(index - 1).limit(1);
```
Problems aren't fetched by their real Mongo `_id` — they're fetched by **position in the sorted list** (`/problems/1`, `/problems/2`, ...). The `id` in the URL is just an index, not a database key. This gives clean, sequential-looking URLs (`/problems/1` instead of `/problems/64f2a...`), but it means a problem's URL isn't stable — if you insert a new problem, or delete one, every later problem's URL number shifts. Good self-aware line for an interview: *"I used positional indexing instead of Mongo IDs in the URL for cleaner-looking routes, but I know that makes URLs unstable across inserts/deletes — a slug field or exposing the real ObjectId would be the fix."*

### `app/api/submissions/[problemId]/route.ts` vs `app/api/submissions/user/[userId]/route.ts` vs `app/api/user/profile/[userId]/route.ts`
All three do the same fundamental thing — query `Submission` by some ID and populate the related `Problem` fields — just scoped differently: one problem+user, all of one user's submissions, or a user's full profile bundle. Recognizing "these three routes are really one query pattern reused three ways" is a good thing to say out loud; it also tells you where you'd introduce a shared helper function if you refactored.

### `app/api/contests/[contestId]/register/route.ts`
Straightforward: load the contest, check `contest.participants.some(p => p.toString() === userId)` to prevent double-registration, push and save if not already registered. Correct, simple, no bugs here.

### A real bug worth knowing before you demo this live: `app/api/leaderboard/route.ts`
This one is worth being upfront about rather than getting caught by it live:

```ts
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }   // <-- expects a dynamic [userId] segment
) { ... }
```

But the file lives at `app/api/leaderboard/route.ts` — a **plain, non-dynamic route**, with no `[userId]` folder anywhere in the path. There is no way for a `userId` to actually reach this handler. Meanwhile, three different frontend pages (`app/problems/page.tsx`, `app/leaderboard/page.tsx`, and the old `pageold.tsx`) call `fetch('/api/leaderboard')` with **no ID at all**, expecting back a `{ success: true, leaderboard: [...] }` shape (a ranked array of users with `username`, `solved`, `streak`). The current handler can't produce that — it's written to fetch one user's submissions, not aggregate all users into a ranking.

**Say this plainly if asked, rather than let them find it:** *"I know this endpoint is currently non-functional — it was written for a per-user submissions view but never finished into the actual aggregation query the frontend expects. What it needs is a Mongo aggregation pipeline: group `Submission` by `user`, filter to `status: 'Accepted'`, get a `$addToSet` of unique `problem` IDs per user for the solved count, then sort descending. That's actually a nice aggregation-pipeline talking point for a DBMS-adjacent question."* Interviewers respect "I know exactly what's broken and exactly how I'd fix it" far more than a project that looks flawless until they run it.

---

## 7. Frontend pages — the shared pattern, then what's distinct about each

Almost every page in `app/` follows the same shape: `"use client"` → `useState` for data + loading → one or more `useEffect(() => { fetch(...) }, [])` → derive filtered/sorted/computed values from that state → render. Once you can say that sentence, you don't need to explain every page's JSX line by line — you explain what's *different* about each:

- **`app/page.tsx`** (home) — landing/marketing page, mostly static content introducing the platform.
- **`app/log-in/page.tsx`** / **`app/sign-up/page.tsx`** — controlled form inputs via one `formData` state object, POST to the auth routes, on success store the returned user in `localStorage` and redirect. Sign-up additionally checks `password === confirmPassword` client-side before hitting the API.
- **`app/playground/page.tsx`** — a scratchpad, not tied to any problem: language selector swaps both the Monaco `language` prop and a starter code snippet, "Run" hits `/api/execute` directly (not `/api/submissions/create`, since there's no problem/test cases to judge against here), and there's a nice small feature — "Save File" builds a `Blob` client-side and triggers a download with the right extension per language.
- **`app/problems/page.tsx`** — the most data-dense page: fetches problems + the current user's submissions in parallel (`Promise.all`), then does several things **entirely client-side** rather than via a dedicated API: computes solved-count as a `Set` of unique accepted problem IDs, computes a daily streak by walking backwards day-by-day through submission dates, computes difficulty breakdown percentages, and filters/sorts the table by search term, tag, and difficulty — all in local component state, no server round-trip per filter change. Good to mention: *"Filtering and streak calculation happen client-side against already-fetched data, so there's no network latency per keystroke — but it does mean the streak logic isn't reusable server-side, e.g. for a notification job."*
- **`app/problems/[id]/page.tsx`** — the core product page: two tabs (Description / Submissions), Monaco editor with per-language starter snippets, a "Run" button (custom input, no judging, just `/api/execute`) separate from a "Submit" button (`/api/submissions/create`, judged against all hidden test cases). Submissions tab lazily fetches only when clicked (`useEffect` keyed on `activeTab`).
- **`app/contest/page.tsx`** — computes contest status (`upcoming` / `live` / `ended`) purely from comparing `Date.now()` against `startTime`/`endTime` — no server-side "status" field stored; status is always derived, so it's always accurate without needing a cron job to update anything. Includes a live `CountdownTimer` component using `setInterval` ticking every second.
- **`app/leaderboard/page.tsx`** — depends on the broken `/api/leaderboard` endpoint above; the rendering logic itself (top-3 podium + ranked list) is fine, it just has nothing correct to render yet.
- **`app/profile/page.tsx`** — builds a **365-day GitHub-style activity heatmap client-side**: buckets every submission's `createdAt` into a `YYYY-MM-DD` key, then generates exactly 365 consecutive days and looks up each day's count from that map. Also computes "accuracy" as `unique solved problems / total submissions` — worth noting that's *problems solved*, not *submissions accepted*, i.e. it doesn't penalize multiple wrong attempts on the same problem the way a stricter "accepted submissions / total submissions" ratio would.
- **`app/admin/add-problem/page.tsx`** / **`add-contest/page.tsx`** — forms for creating problems/contests. Both gate access with a `useEffect` that checks `localStorage` user's email against `NEXT_PUBLIC_ADMIN_EMAIL` and redirects home if it doesn't match — the comment in the code itself says *"We'll also verify this on the backend for real security"*, and as covered above, that backend check was never actually completed. This is the same gap from two angles (frontend hint + unfinished backend enforcement) — good to present as one gap, not two.
- **`app/components/Navbar.tsx`** — the sliding-underline nav indicator: on every route change, it queries the DOM for the link matching the current `pathname` via a `data-path` attribute, reads its `offsetLeft`/`offsetWidth`, and animates an absolutely-positioned `<span>` to that position — a nice small piece of pure client-side DOM measurement logic, unrelated to any framework component library.
- **`app/components/Footer.tsx`** — static content, nothing logic-bearing.
- **Dead/legacy files**: `app/problems/pageold.tsx`, `app/problems/[id]/pageold.tsx`, `app/api/logout/routeold.ts` — earlier drafts kept alongside the live versions. Not wrong to have them, but know they're there and be ready to say they're superseded drafts if an interviewer notices the duplicate file names.

---

## 8. Summary: the "gaps" list, all in one place

Consolidating everything found while reading the actual code, ranked by how likely an interviewer is to find/ask about it:

1. **`/api/leaderboard` is non-functional** — dynamic-route params expected on a non-dynamic route; needs an aggregation pipeline rewrite. (Verified bug, not a stylistic nitpick.)
2. **No server-side session verification** — API routes trust a client-supplied `userId` rather than verifying the httpOnly JWT cookie server-side. Anyone could act as any user by editing localStorage.
3. **Admin authorization is frontend-only** — `NEXT_PUBLIC_ADMIN_EMAIL` gates the UI, but `/api/problems/create` never actually enforces it server-side (the check is a comment).
4. **No `role` field on User** — so even a fixed admin check would need real RBAC modeling to scale past "one hardcoded admin email."
5. **`/api/problems/[id]` uses positional index, not `_id`** — URLs shift if problems are inserted/deleted out of order.
6. **Judging is sequential, not parallelized or queued** — one test case at a time, synchronous HTTP call per case, no job queue.
7. **Contest problems have no live scoring/ranking computed** — contests group problems and track registration, but there's no per-contest leaderboard logic yet.
8. Several dead "old" files left in the repo (harmless, but notice them before someone else does).

Volunteering 2-3 of these unprompted (pick the leaderboard bug and the auth gap — they're the most technically interesting) is a stronger interview move than waiting to be caught.