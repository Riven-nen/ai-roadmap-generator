# System Test Report

**Project:** IT Roadmap / AI Roadmap Generator  
**Test date:** November 24–25, 2026  
**Environment:** Local Next.js server (`http://localhost:3001`) backed by Supabase  
**Test level:** Route, API, database, RLS, AI, and build verification  
**Result:** **31/31 core data/API tests passed**; all route and role checks passed after correcting test assertions.

---

## 1. Test approach

The system was tested at four levels:

1. **Page and redirect tests** — sign in as each role, open every main page, and verify access rules.
2. **API tests** — exercise the Add Users, AI, chat, recommendation, and quiz submission endpoints.
3. **Database and RLS tests** — create temporary subjects, classes, students, enrollments, drafts, and exams, then verify permissions and cleanup.
4. **Build tests** — run the production build and lint.

Temporary data was created and removed after testing. No demo records were left modified.

> Note: The in-app browser tool was not connected during this test run, so pointer-level UI actions such as literal mouse dragging were verified through the underlying data/API behavior, page rendering, and code inspection rather than a recorded browser session.

---

## 2. Authentication and access control

| Test | Expected | Result |
|---|---|---|
| Admin login | Success | PASS |
| Student login | Success | PASS |
| Professor login | Success | PASS |
| Unauthenticated `/admin` | Redirect to `/login` | PASS |
| Unauthenticated `/teacher` | Redirect to `/login` | PASS |
| Unauthenticated `/roadmap` | Redirect to `/login` | PASS |
| Unauthenticated `/profile` | Redirect to `/login` | PASS |
| Student opens `/admin` | Blocked, redirect to `/` | PASS |
| Student opens `/teacher` | Blocked, redirect to `/` | PASS |
| Professor opens `/admin` | Blocked, redirect to `/` | PASS |
| Admin opens `/teacher` | Redirect to `/admin` | PASS |
| Admin opens `/` | Redirect to `/admin` | PASS |
| Professor opens `/` | Redirect to `/teacher` | PASS |

---

## 3. First-login password setup

| Test | Expected | Result |
|---|---|---|
| New admin-created account is flagged | `must_change_password = true` | PASS |
| First login returns `mustChangePassword` | `true` | PASS |
| First visit to `/` redirects | `/set-password` | PASS |
| Set-password page loads | 200 | PASS |
| User sets a new password | Supabase password update succeeds | PASS |
| Setup completion clears the flag | `must_change_password = false` | PASS |
| Login with the new password | `mustChangePassword = false` | PASS |
| Existing demo accounts | Not forced to change | PASS |
| Existing LCUP account used in the screenshot | Flagged for setup | PASS |

The first-login flow does not depend on email delivery. The user is forced to set a password with the temporary password they were given.

### Credential delivery

- Created accounts show a **mailto** link containing the email, temporary password, and login URL.
- Credential rows persist in `sessionStorage` across a refresh in the same tab.
- **Mark sent** removes only that email from the pending list.
- The pending-credential store was tested for add, remove, persist, clear, and change notification: **PASS**.

### Next.js 16 proxy fix

The previous auth gate lived in `middleware.ts`. Next.js 16 uses `src/proxy.ts` for this project layout. That file was renamed and the export changed to `proxy`, so first-login redirects and route protection now actually run.

---

## 4. Student pages and data

| Test | Expected | Result |
|---|---|---|
| Student dashboard `/` | Loads Knowledge Map and AI Academic Advisor | PASS |
| Student roadmap `/roadmap` | Loads successfully | PASS |
| Course roadmap `/roadmap/course/[id]` | Loads IT 101 successfully | PASS |
| AI Discovery `/discovery` | Loads successfully | PASS |
| Subject library `/courses` | Loads successfully | PASS |
| Student profile `/profile` | Shows appearance, domain proficiency, program/year/section, academic year | PASS |
| Student roadmap data | 26 subjects, 1 enrollment, 32 topics, 31 edges, 2 quizzes for the demo student | PASS |
| Discovery data | 3 career paths and 10 career requirements available | PASS |
| Student cannot self-enroll | 403 from RLS | PASS |
| Student cannot edit a roadmap draft | Update ignored by RLS | PASS |
| Student cannot publish a roadmap | 403 | PASS |
| Student cannot read quiz answer keys | `correct_option` denied (403) | PASS |

---

## 5. Professor tests

| Test | Expected | Result |
|---|---|---|
| Professor dashboard `/teacher` | Shows assigned class and build link | PASS |
| Professor builder access | 200 | PASS |
| Professor recognized for assigned subject | `true` | PASS |
| Professor creates a roadmap draft | Success | PASS |
| Professor publishes the draft | Success, revision incremented | PASS |
| Published nodes saved | 2 nodes | PASS |
| Published edge saved | 1 edge | PASS |
| Unassigned professor is not recognized | `false` | PASS |
| Unassigned professor draft update | Ignored by RLS | PASS |
| AI node generation | Returns description, content, objectives | PASS |
| AI tutor chat | Returns a real answer | PASS |
| AI recommendation | Returns real advice | PASS |

---

## 6. Administrator tests

| Test | Expected | Result |
|---|---|---|
| Admin panel `/admin` | Loads command center, KPIs, shortcuts, attention list | PASS |
| Stats page `/admin/stats` | Loads charts, coverage, top rosters | PASS |
| Subjects page `/admin/courses` | Loads subject table and add link | PASS |
| Classes page `/admin/sections` | Loads class table and create form | PASS |
| Students page `/admin/students` | Loads student list | PASS |
| Add Users page `/admin/students/new` | Loads single and CSV modes | PASS |
| Class detail | Shows section details, professors, enrollment, final exam | PASS |
| Create subject | 201 | PASS |
| Create class | 201, generated `BSIT 1Z` | PASS |
| Duplicate class | 409 | PASS |
| Class with wrong term | 400 from database validation | PASS |
| Create student with course/year/section | Success | PASS |
| Student profile fields saved | BSCpE / Year 2 / Section D | PASS |
| Admin enrolls student | 201 | PASS |
| Duplicate course enrollment | 409 | PASS |
| Assign professor | 201 | PASS |
| Update class section | 200, generated `BSIT 1Y` | PASS |
| Create section final exam | 201 | PASS |
| Create final exam question | 201 | PASS |
| Clone 12 questions from a course exam | 12 copied | PASS |

---

## 7. Quiz and grading tests

### Final exam

| Step | Result |
|---|---|
| Temporary class and final exam created | PASS |
| Temporary student enrolled | PASS |
| Correct answers submitted | Score 100, passed |
| Grade saved | `1.0` |
| Enrollment progress | `100` |
| Enrollment status | `completed` |

### Topic quiz

| Step | Result |
|---|---|
| Topic quiz submitted | Score 100, passed |
| Topic progress row saved | `completed` |

### Bug found and fixed

**Problem:** Final exam scores were calculated but not saved. The student session had no permission to update `enrollments`, so the grade update silently affected zero rows.

**Fix:** Added the security-definer `record_quiz_result` database function and changed `/api/quiz/submit` to use it. The function grades the quiz, updates topic progress or enrollment grade, and returns the score.

**Retest:** Grade `1.0`, progress `100`, status `completed`.

---

## 8. Security checks

| Check | Expected | Result |
|---|---|---|
| Anonymous user reads `quiz_questions.correct_option` | Denied | PASS — 401 |
| Authenticated student reads `correct_option` | Denied | PASS — 403 |
| Authenticated student reads safe question columns | Allowed | PASS — 200 |
| Student edits roadmap draft | Denied | PASS |
| Student publishes roadmap | Denied | PASS |
| Student inserts enrollment | Denied | PASS |
| Unassigned professor edits draft | Denied | PASS |
| Admin-only pages for student/professor | Redirected | PASS |

### Bug found and fixed

**Problem:** `quiz_questions` allowed any authenticated user to select `correct_option`, even though the UI said grading happens on the server.

**Fix:**
- Column-level grants now expose only `id`, `quiz_id`, `question_text`, and `options`.
- `correct_option` is readable only inside security-definer functions.
- Added `clone_quiz_questions` so section exams can copy questions without exposing answer keys to the browser.

**Retest:** Answer key reads are denied; safe question reads work; cloning 12 questions works.

---

## 9. Class and academic-year validation

| Rule | Result |
|---|---|
| Class year level must match subject year level | PASS — rejected with 400 |
| Class term must match subject semester | PASS — rejected with 400 |
| Duplicate subject/section/year/term | PASS — rejected with 409 |
| Academic year must be two consecutive years | PASS — client validation |
| Different sections of the same subject | PASS — BSIT 1A, 1B, 1C allowed |
| Library join code stays unique | PASS |

---

## 10. Build and lint

```text
npm run lint   → PASS
npm run build  → PASS
```

All routes compiled and all dynamic pages rendered.

---

## 11. Temporary data cleanup

Confirmed after testing:

- Temporary subjects: **0**
- Temporary student/professor accounts: **0**
- Temporary topic progress rows: **0**
- Temporary courses/sections: **0**

Demo records and existing classes were not removed.

---

## 12. Known limitations and recommendations

1. **Browser-level drag-and-drop was not automated.** The builder’s data operations, permissions, draft save, and publish flow were verified, but a final human click-through of node dragging, connection dragging, and auto-arrange is recommended.
2. **Forgot-password email delivery depends on Supabase email settings.** The reset flow is implemented, but a test request to `dev-admin@school.edu` was rejected by Supabase as an invalid address. A real LCUP mailbox and working SMTP/SPF/DKIM setup are needed for live delivery.
3. **AI responses vary.** The AI endpoints work, but content quality and response time depend on Groq.
4. **AI content should be reviewed.** The assistant can make factual mistakes or suggest a resource that needs checking.
5. **Stored themes are per browser.** They are not stored on the user account.
6. **Production branch.** Production is currently served by `master` after fast-forwarding it to the feature branch commit. The fallback is `backup/pre-admin-panel`.

---

## 13. Final result

**System status: READY for a full manual walkthrough.**

Core login, role access, student pages, professor builder, admin management, class validation, enrollment rules, AI endpoints, final exams, topic quizzes, RLS, and build checks passed. Two functional/security issues found during the test were fixed and retested.
