# Online Judge — Full Answer Key (All 110 Questions)

Same order and numbering as the question bank, so you can study them side by side.

---

## A. Project overview / motivation

**1. Walk me through this project.**
A full-stack competitive-programming platform — sign up, browse problems, write code in an in-browser Monaco editor, submit it, get judged against hidden test cases across C++/Java/Python/JS, join contests, and track progress on a profile/leaderboard.

**2. Why did you build this instead of using an existing online judge?**
As a heavy user of Codeforces/LeetCode/CodeChef, I wanted to understand what happens behind "Submit" — the judging logic, data modeling, and auth — not just consume it. Building it forced real decisions (build-vs-buy on execution, error precedence in judging) that using a platform never would.

**3. What problem does this solve that existing platforms don't?**
Honestly, it's not trying to out-feature Codeforces — it's a from-scratch demonstration of the same core pipeline (submit → judge → rank), built to show I understand the internals, not to replace existing platforms.

**4. Who is the intended user of this platform?**
Students practicing DSA/competitive programming, similar to me — someone wanting problems, an editor, and a way to track solved problems and progress over time.

**5. Elevator pitch in one sentence?**
"A mini Codeforces — solve problems in-browser, get instantly judged against hidden test cases, and track your progress."

**6. What inspired the specific features (contests, leaderboard, streaks)?**
Direct mirrors of the platforms I use daily — Codeforces contests and rating, LeetCode's streak/heatmap on the profile — features I know matter to users because I am one.

**7. How long did this take, and how did you scope it?**
Built incrementally: data models first, then auth, then core judging (the hardest part), then contests/leaderboard/profile as layers on top of the same submission data — so each layer reused the previous one instead of duplicating logic.

**8. What was the first feature you built, and why start there?**
The data models (User, Problem, Submission, Contest) — everything else is either producing or consuming that data, so the schema had to be right first.

**9. Résumé bullet version?**
"Built a full-stack online judge (Next.js, MongoDB, JWT auth) with a multi-language judging pipeline integrating Judge0, handling error-precedence resolution and output normalization across hidden test cases."

---

## B. Architecture & tech stack

**10. What's the overall architecture — draw it for me.**
Browser (Next.js pages) → Next.js API routes (`/api/*` for auth, problems, contests, execute, submissions, leaderboard) → MongoDB (User/Problem/Submission/Contest) for persistence, with `/api/execute` and the judging route also calling out to the external hosted Judge0 API for actual code execution.

**11. Why Next.js instead of separate React + Express?**
One codebase, one deploy target, no CORS config between two servers — for a solo build, faster iteration adding a feature end-to-end (page + its API route) without context-switching repos.

**12. Why MongoDB instead of Postgres?**
Problems have a variable shape (different numbers of test cases, optional constraint fields, tag arrays) that fits a document model without migrations every time it varies. Honest answer if pushed: Postgres would work fine too, given the relationships here are simple — Mongo was mainly chosen for schema flexibility and Mongoose's fast iteration early on.

**13. Why reference (`ObjectId`) instead of embed?**
`Submission` grows unboundedly and needs independent queries ("all submissions by user X", "all submissions for problem Y") — embedding submissions inside User or Problem documents would make those queries expensive and blow up document size.

**14. Walk me through Submit-click → verdict, end to end.**
Frontend POSTs code+language+problemId to `/api/submissions/create` → route loads the problem's hidden test cases from MongoDB → loops through each, calling `/api/execute` (which itself calls Judge0) → for each result checks compile error → runtime error → output mismatch (after whitespace normalization) → stops at first failure or marks Accepted if all pass → saves a `Submission` document with the final status → frontend displays the verdict.

**15. Why TypeScript over plain JS?**
Type safety across API and frontend — e.g., `Submission.status` is a fixed enum, and TypeScript catches a typo'd status string at compile time instead of failing silently at runtime.

**16. Why Tailwind over a component library?**
Utility classes let me iterate on layout fast without hopping between CSS files or fighting a library's default look — matters for styling velocity building solo.

**17. Why Monaco over a simpler input?**
Same editor engine as VS Code — syntax highlighting, bracket matching, multi-language support are table stakes for a judging platform; a plain textarea would feel broken next to real OJs.

**18. Role of Mongoose vs. native driver?**
Schema definitions with types/enums/defaults/required fields and validation, plus a cleaner query API (`.populate()` for joins across `ObjectId` refs) versus hand-writing that validation against the raw driver.

**19. How is the project structured, and why?**
Next.js App Router conventions — `app/` folder-based routing, colocated `api/` subfolder for backend routes, `models/` for Mongoose schemas, `components/` for shared UI (Navbar/Footer) — keeps related frontend page + its data fetching logic physically close.

**20. What would you change about the architecture if rebuilt today?**
Add a shared server-side auth-verification middleware instead of trusting client-supplied user IDs, and move judging off the synchronous request path onto an async queue — both covered in detail below.

---

## C. Authentication & security

**21. How does auth work, end to end?**
Signup: bcrypt-hash password → save User → sign JWT with just the user's Mongo `_id` → set as httpOnly cookie. Login: bcrypt-compare → same JWT/cookie step. Logout: delete the cookie.

**22. Why httpOnly cookie over localStorage?**
JavaScript (and therefore an XSS payload) can't read an httpOnly cookie, so a stored JWT can't be exfiltrated the way a localStorage token could.

**23. What does `sameSite: "strict"` protect against?**
CSRF — the cookie won't be attached to requests originating from a different site, so a malicious site can't trigger authenticated actions on your app via the victim's browser.

**24. Why bcrypt, and what does the "10" mean?**
Bcrypt has salting built in (each hash is unique even for identical passwords) and is deliberately slow to resist brute-force. The `10` is the cost factor/number of hashing rounds (2^10 iterations) — higher is slower but more resistant to brute force.

**25. If I edit localStorage and change my user ID, what happens?**
Right now, you could act as another user — API routes trust the `userId` sent from the client rather than re-deriving identity from the verified JWT cookie server-side. This is a known, real gap I'd fix with server-side middleware before calling this production-ready.

**26. Do you verify the JWT server-side on every request? Show me where.**
No — that's exactly gap #25. The cookie is set correctly but no route currently calls `jwt.verify()` against it to authorize a request; that verification step doesn't exist yet.

**27. How is admin access controlled currently? Is it secure?**
Frontend-only: `NEXT_PUBLIC_ADMIN_EMAIL` is compared against the logged-in user's email (from localStorage) to conditionally show/hide the admin UI and redirect non-admins. It is not secure — the backend route for creating problems has the same check written only as a comment, never enforced in code.

**28. Auth vs. authorization — where does this project fall short?**
Authentication (proving who you are via JWT) is implemented correctly. Authorization (proving you're *allowed* to do a specific action, like create a problem) isn't enforced server-side anywhere — that's the gap.

**29. How would you add RBAC?**
Add a `role: enum ["user","admin"]` field to the `User` schema, then write a small middleware/helper that verifies the JWT, loads the user, checks `role === "admin"`, and reject with 403 before any admin-only route's logic runs.

**30. What would a CSRF attack look like here, and are you protected?**
An attacker's site tricks a logged-in user's browser into submitting a request to your API (e.g., a hidden auto-submitting form). `sameSite: "strict"` blocks this because the cookie won't be sent on that cross-site request in the first place.

**31. How is logout handled — is the JWT invalidated or does it just expire?**
It's not invalidated server-side (JWTs are stateless) — logout just deletes the cookie client-side. The token would technically still be valid if someone had captured it before logout, until its 7-day expiry. A real fix would need a server-side denylist or short-lived tokens with refresh.

**32. What happens if JWT_SECRET leaks?**
Anyone could forge a valid token for any `userId` and fully impersonate any user — this is why it's an env var, never committed, and should be rotated immediately if exposed (which would also invalidate all existing sessions).

**33. Why 7-day expiry — what's the tradeoff?**
Balances user convenience (not re-logging-in constantly) against exposure window if a token is stolen. Shorter-lived tokens + refresh tokens would be the more secure production pattern.

**34. Is there rate-limiting on login/signup?**
No — currently unprotected against brute-force login attempts. I'd add IP-based rate limiting (e.g., a simple in-memory or Redis-backed limiter) on the login route specifically.

---

## D. Code execution engine

**35. How do you execute arbitrary, potentially malicious code safely?**
I don't run it myself — I send it to Judge0, a hosted, purpose-built sandboxed execution engine, so I never execute untrusted code inside my own server process.

**36. Why Judge0 instead of building your own sandbox?**
Container/VM-based isolation for arbitrary code execution is a hard, security-critical problem on its own. Building it myself would mean spending most of my time reinventing sandboxing instead of building the judging logic and platform features — a deliberate build-vs-buy tradeoff.

**37. What are the general risks of running untrusted code unsandboxed?**
Arbitrary filesystem access, network calls, resource exhaustion (fork bombs, infinite loops), and potentially escaping to the host machine — exactly why real OJs never `eval`/`exec` user code directly on their own servers.

**38. What exactly does `/api/execute` send/receive from Judge0?**
Sends base64-encoded `source_code`, `language_id`, and `stdin` via POST to `https://ce.judge0.com/submissions?wait=true&base64_encoded=true`; receives back base64-encoded `stdout`/`stderr`/`compile_output` plus status, execution time, and memory, which I decode and normalize.

**39. Why base64-encode code/stdin before sending?**
Judge0 requires it — avoids issues with special characters, newlines, and encoding mismatches breaking the JSON payload over HTTP.

**40. What does `wait=true` do, and what's the alternative?**
Makes Judge0 block and return the result synchronously in one response, instead of you submitting a job and polling a separate results endpoint until it's ready — simpler for my use case since I don't need a queue on the Judge0 side.

**41. How do you distinguish compile error / runtime error / wrong answer?**
Check `compile_output` first (if present, it's a Compilation Error) — before treating a non-empty `stderr` as a Runtime Error — then only if both are empty do I compare actual vs. expected `stdout`.

**42. What happens if Judge0 is down or rate-limited?**
Currently, execution requests would fail/timeout, and submissions would likely error out — there's no fallback or self-hosted backup instance configured. A production fix would be self-hosting Judge0 or adding retry/backoff.

**43. How would you self-host Judge0?**
Judge0 provides an official Docker Compose setup; I'd run that on my own infrastructure and swap the base URL in `/api/execute`, removing the dependency on the shared public rate limits.

**44. How do you support multiple languages, and how would you add one?**
A language-name-to-Judge0-`language_id` map (`{cpp:54, c:50, python:71, java:62, javascript:63}`); adding a new language means adding its Judge0 ID to that map and a starter-code snippet on the frontend.

**45. Is there an execution timeout? What happens on an infinite loop?**
Judge0 itself enforces its own default time/memory limits per submission and would return a Time Limit Exceeded status — my app doesn't set a custom limit itself, it relies on Judge0's default.

---

## E. Submission judging logic

**46. Walk me through the judging algorithm.**
For each hidden test case: run the code via `/api/execute` with that test's input → check for compile error first, then runtime error, then normalize and compare actual vs. expected output → stop at the first failure and record its index, or mark Accepted if every case passes.

**47. Why check errors in that specific order?**
A compile error should never be reported as a "Wrong Answer" — that would be misleading and mask the real problem. Checking compile → runtime → output mismatch in that precedence ensures the most fundamental failure is always the one reported.

**48. What does `normalizeOutput()` prevent?**
False "Wrong Answer" verdicts caused by formatting differences — `\r\n` vs `\n` line endings, trailing whitespace per line, trailing blank lines — rather than actual logic errors in the user's code.

**49. Why stop at the first failing test case instead of running all?**
Mirrors real judges (Codeforces/LeetCode both fail-fast and show "failed on test #N") and saves execution cost — no reason to burn more Judge0 calls once a submission has already failed.

**50. What is `failedTestCaseIndex` used for?**
Lets the frontend tell the user exactly which hidden test case their submission failed on, similar to how Codeforces reports "Wrong answer on test 3."

**51. How would you detect TLE specifically — what's missing?**
Judge0 already reports a TLE status per execution based on its own time limit; I'd map that status through explicitly in my judging route (currently it's not distinctly branched from a generic runtime failure) and expose per-problem custom time limits if I wanted control over the threshold.

**52. How would you support memory-limit checking?**
Judge0 returns `memory` used per execution; I'd store a per-problem memory limit field and compare returned memory against it, marking a distinct "Memory Limit Exceeded" status.

**53. Is judging idempotent — resubmitting the same code twice?**
Not idempotent by design — each submit creates a new `Submission` document; resubmitting identical code just re-runs and re-judges it, creating a duplicate record. That's actually correct/expected behavior for an OJ (you want submission history), not a bug.

**54. How do you prevent submission spam?**
Currently nothing stops rapid resubmission. I'd add a short per-user cooldown or rate limit on `/api/submissions/create` to prevent someone from hammering the judging pipeline (and by extension, Judge0's rate limit).

**55. Why is the sequential `await` loop a problem at scale, and how would you fix it?**
Each test case blocks on a full network round-trip to Judge0 before the next starts, so total judging time scales linearly with test case count and ties up the request for that whole duration. I'd parallelize independent test-case runs with `Promise.all` (capped to avoid overwhelming Judge0), and longer-term move judging off the synchronous request entirely onto an async worker queue.

---

## F. Data modeling

**56. Walk me through your four schemas from memory.**
`User`: username, email, password (hash). `Problem`: title, description, difficulty enum, tags, format/constraints fields, testCases array of input/output pairs. `Submission`: user ref, problem ref, language enum, code, status enum, executionTime, memory, failedTestCaseIndex, timestamps. `Contest`: title, description, startTime/endTime, problems array of refs, participants array of refs.

**57. Why does Problem embed testCases rather than a separate collection?**
Test cases are always accessed together with their parent problem and never queried independently across problems — a natural fit for embedding rather than the join overhead of a separate collection.

**58. Why does Submission reference rather than embed user/problem data?**
Submissions need independent queries scoped by user or by problem, and grow unboundedly — embedding would duplicate user/problem data across potentially millions of submission documents and make those documents unbounded in size.

**59. What indexes would you add to Submission as this scales?**
Compound indexes on `{user: 1, createdAt: -1}` (profile/history queries) and `{problem: 1}` (per-problem submission stats), since those are the two most frequent query patterns.

**60. How would you query "problems a user hasn't solved yet"?**
Aggregate the user's `Submission`s where `status: "Accepted"` into a distinct set of solved `problem` IDs, then query `Problem.find({_id: {$nin: solvedIds}})`.

**61. How would you model a leaderboard aggregation pipeline?**
`$match` submissions with `status: "Accepted"` → `$group` by `user`, `$addToSet` unique `problem` IDs → `$project` the size of that set as `solvedCount` → `$sort` descending by `solvedCount` → `$lookup`/populate username.

**62. Normalization vs. embedding tradeoff, using your schemas as example.**
Embed when data is always read together and bounded (testCases inside Problem); reference when data grows independently and needs its own query patterns (Submission referencing User/Problem). My schema uses both deliberately, not just one pattern everywhere.

**63. Race condition risk on simultaneous submissions?**
Each submission is an independent document insert, so two simultaneous submissions from different users don't conflict. The one place a race could theoretically matter is the signup email-uniqueness check (manual `findOne` before insert) — I do also catch Mongo's duplicate-key error `11000` as a backup for that race.

**64. How would you paginate the problems list at scale?**
Add `.skip()`/`.limit()` or cursor-based pagination (`_id`-based `$gt` cursor for better performance than skip at large offsets) to the problems-fetch route, plus corresponding "load more"/page-number UI.

---

## G. Frontend / React specifics

**65. Why client components everywhere — could any be server components?**
Almost everything fetches data in `useEffect` after mount and holds interactive state (forms, editors, filters), which needs `"use client"`. Pages with more static content, like parts of the home page, could be server components to reduce client JS — a real potential optimization.

**66. How does the sliding nav underline work?**
On each route change, it finds the DOM node matching the current path via a `data-path` attribute, reads its `offsetLeft`/`offsetWidth`, and animates an absolutely-positioned span to match — pure DOM measurement, not a UI library feature.

**67. How is the daily streak computed, and what edge cases matter?**
Walks backward day-by-day from today through the user's submission dates, checking if each consecutive day has at least one submission; breaks the streak on the first gap. Edge cases: timezone boundaries (a submission at 11:59pm vs 12:01am could count for different days depending on timezone handling) and what counts — any submission vs. only accepted ones.

**68. How is the 365-day heatmap built?**
Buckets every submission's `createdAt` into a `YYYY-MM-DD` key in a map, then generates 365 consecutive calendar days and looks up each day's count from that map for rendering.

**69. Why is filtering/search done client-side on the problems page?**
All problems are already fetched once; filtering in-memory avoids a network round-trip per keystroke, keeping the UI instant.

**70. Tradeoff of client-side vs. server-side filtering as data grows?**
Fine while the problem set is small enough to fetch entirely upfront; becomes a real cost (large initial payload, slower first load) once there are thousands of problems — at that point, server-side filtering/pagination becomes necessary.

**71. How is contest status computed — stored or derived?**
Derived, not stored — compares `Date.now()` against the contest's `startTime`/`endTime` on every render, so status is always correct without needing a background job to update a stored field.

**72. How does the countdown timer avoid memory leaks?**
Uses `setInterval` inside a `useEffect`, with a cleanup function that calls `clearInterval` on unmount — without that cleanup, the interval would keep firing after the component is gone.

**73. Why localStorage instead of Context/Redux for auth state?**
Simpler for the project's current size — no need for global state management infrastructure when a handful of components just need to read the same `user` object. Tradeoff: it doesn't stay in sync automatically across tabs/components the way a proper global state or context provider would.

**74. What would you refactor first if a second developer joined?**
Extract the repeated "fetch → useState → render" fetching pattern into a shared custom hook, and centralize the scattered client-side auth checks (localStorage reads for email comparison) into one reusable helper instead of duplicating it per page.

---

## H. Contests & Leaderboard

**75. Explain the `/api/leaderboard` bug and how you'd fix it.**
The route handler is written expecting a dynamic `[userId]` URL parameter, but the file lives at a plain non-dynamic path with no such segment — so `userId` is never actually received. Meanwhile the frontend calls it with no ID at all, expecting a ranked array of all users back. I'd rewrite it as a proper aggregation pipeline (see answer 61) that needs no per-user ID at all, since it's meant to rank everyone.

**76. How would you compute a proper leaderboard ranking?**
Same aggregation as answer 61 — group accepted submissions by user, count distinct problems solved, sort descending.

**77. How is contest registration handled?**
Load the contest, check if the user's ID already exists in the `participants` array (`.some()`), and only push+save if not already registered — prevents duplicate registration.

**78. Is there live scoring during a contest?**
No — contests currently just group problems and track registered participants; there's no per-contest score/rank computed from submissions made during the contest window yet.

**79. How would you handle ties in contest rankings?**
Standard competitive-programming tiebreak: same problems-solved count, then whoever reached that count with less total penalty time (or earlier last-accepted-submission timestamp) ranks higher — would need to track submission timestamps relative to contest start.

**80. How would you prevent submissions to a contest problem after it ends?**
In the judging route, check the contest's `endTime` against `Date.now()` before accepting a submission tied to a contest context, rejecting late submissions (or accepting them but flagging as "practice," not "contest" submissions).

---

## I. Scalability & systems design

**81. How would you scale this to thousands of concurrent submissions?**
Move judging off the synchronous request path onto an async job queue (BullMQ/Redis) with a worker pool, parallelize test cases within a submission, cache leaderboard/read-heavy aggregations, and protect/self-host the Judge0 dependency.

**82. What's the current bottleneck, specifically?**
The submission route awaits each hidden test case's Judge0 call one at a time inside a single synchronous HTTP request — so judging time scales linearly with test-case count and each request stays open the whole time.

**83. How would an async job queue change the architecture?**
Submit endpoint would just write a `Pending` submission and enqueue a job, returning immediately; a separate worker process pulls jobs, runs them against Judge0, and updates the submission's status on completion — decoupling user-facing latency from actual judging time.

**84. How would you cache the leaderboard?**
Store a materialized, periodically-recomputed leaderboard (or cache the aggregation result in Redis with a short TTL) instead of recomputing the full aggregation on every page load, since leaderboard reads vastly outnumber the writes (new accepted submissions) that would invalidate it.

**85. What would you change if reads vastly outpaced writes?**
Add read replicas for MongoDB for leaderboard/profile/problem-list reads, and cache aggressively, while keeping the submission write path on the primary for consistency.

**86. How would you horizontally scale the Next.js API routes — what state lives on one instance?**
The routes themselves are stateless (no in-memory session state — auth is via JWT), so they scale horizontally fine as-is; the actual constraint is the shared MongoDB and the shared external Judge0 rate limit, not the Next.js layer itself.

**87. How do you avoid cascading failures if Judge0 rate-limits under load?**
Add backoff/retry with a queue absorbing bursts instead of every request hitting Judge0 directly, and size the worker pool's concurrency to stay under Judge0's actual throughput limit rather than firing unlimited parallel requests.

**88. How would you add observability?**
Log/alert on judging queue depth, average judge latency, and Judge0 error rates; track submission status distribution over time to catch, e.g., a spike in Compilation Errors that might indicate a Judge0-side issue rather than a code issue.

**89. What would a realistic load test need to simulate?**
Concurrent submission bursts (like a contest start, where many users submit within seconds), sustained execution-call volume against Judge0's actual rate limits, and read-heavy leaderboard/profile traffic happening simultaneously with the write-heavy judging path.

---

## J. Testing, difficulties, self-critique

**90. Hardest bug you hit, and how you found it?**
Correct solutions being marked Wrong Answer due to trailing whitespace/line-ending mismatches between Judge0's returned output and stored expected output — found by manually testing known-correct solutions and diffing the raw strings byte by byte until the invisible `\r\n` difference showed up.

**91. What would you do differently if rebuilt from scratch?**
Build the server-side JWT verification middleware and role-based auth check from day one, rather than adding UI-only admin gating first and backend enforcement "later" (which then never got finished).

**92. Biggest weakness right now, honestly?**
No server-side authorization enforcement — the gap between "auth infrastructure exists" and "requests are actually verified against it" is the single biggest thing separating this from production-ready.

**93. Do you have automated tests? What would you test first?**
No automated tests currently. First priority would be unit tests for `normalizeOutput()` and the error-precedence logic in the judging route, since that's the highest-value, most bug-prone logic in the project.

**94. How did you debug Judge0's response format issues (stderr vs compile_output)?**
By logging raw Judge0 responses for known test submissions across languages and observing that some languages emit warnings to `stderr` even on successful runs — leading to prioritizing `compile_output` and treating `stderr` as fatal only when `stdout` is empty.

**95. A design decision you're not fully happy with?**
Using positional index (`skip/limit`) instead of the real Mongo `_id` for problem URLs — clean-looking URLs, but unstable if problems are inserted or deleted out of order.

**96. If a user reports "my correct code is Wrong Answer," how do you debug it today?**
Pull that submission's stored code and the failed test case's expected output, run the code manually against Judge0 with that exact input, and diff the raw byte output against what's stored in the DB to check for whitespace/encoding mismatches first, since that's the most common root cause I've already hit once.

**97. Have you load-tested this? What breaks first?**
Not load-tested yet. My prediction: the synchronous per-test-case Judge0 calls in the judging route would be the first bottleneck, followed by the public Judge0 instance's own rate limits under any real concurrent load.

---

## K. Behavioral / bridge questions

**98. How does this connect to your competitive programming background?**
Directly — years of submitting to Codeforces/LeetCode gave me a user's intuition for what a judge needs to get right (fail-fast test reporting, clear verdict categories, whitespace tolerance) before I ever wrote the judging code myself.

**99. How does this relate to your NLP internship work?**
Both involve orchestrating external/heavy services behind a clean internal schema — Judge0 here, Whisper + multiple LLMs there — and being explicit about where the current implementation's limits are (judging gaps here; classification taxonomy edge cases there).

**100. What did you learn that you'd apply to your next project?**
Build the security/authorization layer alongside the feature it protects, not after — the admin-check-as-a-comment gap happened specifically because I built the feature first and meant to "add the real check later."

**101. If you had one more month, what would you build next?**
The async judging queue and real server-side auth middleware, in that order — the queue because it's the clearest scale bottleneck, the auth fix because it's the clearest security gap.

**102. A tradeoff you're proud of vs. one you regret?**
Proud of: choosing Judge0 over building a sandbox — kept scope realistic and let me focus on judging logic depth. Regret: shipping the frontend-only admin check without finishing the backend enforcement in the same pass — technical debt that's now a known gap rather than a deliberate choice.

---

## L. Rapid-fire / curveballs

**103. What HTTP status code on invalid login, and why?**
401 Unauthorized — the standard code for "your credentials didn't authenticate," distinct from 403 (authenticated but not permitted) or 400 (malformed request).

**104. What does `problem.testCases` look like as raw JSON?**
`[{ "input": "3\n1 2 3", "output": "6" }, { "input": "...", "output": "..." }, ...]` — an array of plain input/output string pairs.

**105. Judge0 language ID for C++?**
54.

**106. What does `skip(index - 1).limit(1)` do, and why not `findById`?**
Fetches problems sorted by `createdAt`, skips to the `(index-1)`th one, and takes exactly one — used instead of `findById` so problem URLs are clean sequential numbers (`/problems/1`) rather than raw Mongo ObjectIds, at the cost of URL stability across inserts/deletes.

**107. What's in the JWT payload?**
Just `{ userId }` — no email, role, or other claims; anything else needed is looked up fresh from the DB using that ID.

**108. Does `sameSite: "strict"` send the cookie if a user clicks an external link to your site?**
No — `strict` withholds the cookie on essentially all cross-site navigations, including a top-level link click from another site, unlike `lax` which would still send it in that specific case. That's the strictest, most conservative CSRF setting available.

**109. Name one dead/unused file in the repo.**
`app/problems/pageold.tsx` (and similarly `[id]/pageold.tsx`, `app/api/logout/routeold.ts`) — earlier drafts kept alongside the live versions, not yet cleaned up.

**110. The full `Submission.status` enum, from memory?**
`Pending`, `Accepted`, `Wrong Answer`, `TLE`, `Runtime Error`, `Compilation Error`.

---

*Study tip: cover the answer column and try to reconstruct each one from the question alone using your own understanding of the code — that's what will actually hold up under a live follow-up, not the memorized wording here.*