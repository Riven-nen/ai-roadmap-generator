# IT Roadmap — Simple User Manual

This manual explains how to use the system in plain English. It covers the student, professor, and administrator sides.

---

## 1. What the system is

The system is a university IT learning hub. It has three kinds of users:

| Role | What they can do |
|---|---|
| Student | View their roadmap, subjects, career discovery, AI tutor, grades, and profile |
| Professor | View assigned classes and edit/publish the roadmap for subjects they teach |
| Administrator | Manage students, professors, subjects, classes, enrollments, roadmaps, and program statistics |

The system uses these words in a specific way:

- **Subject** — a subject such as IT 101, IT 202, or IT 203.
- **Course** — the degree program: BSIT, BSCpE, or BSIE.
- **Year level** — 1 to 6.
- **Section** — the block letter, such as A, B, or C.
- **Section identity** — course + year + letter, such as **BSIT 1A**.
- **Class** — one subject assigned to one section for one academic year and term, such as **IT 101 for BSIT 1A, 2026–2027, 1st Semester**.
- **Academic year** — a two-year span, such as **2026–2027**.
- **Term** — 1st Semester, 2nd Semester, or Summer.
- **Enrollment** — a student is officially added to a class.

---

## 2. Logging in

1. Open the system in a browser.
2. Enter your email address.
3. Enter your password.
4. Click **Sign In**.

After signing in, the system sends you to the correct home page automatically:

- Student → Student Dashboard
- Professor → My Teaching
- Administrator → Admin Panel

If you enter the wrong password too many times, the account is temporarily locked.

### Forgot password

1. Click **Forgot password** on the login page.
2. Enter your email.
3. Open the recovery email and follow the link.
4. Set a new password.

---

## 3. Student guide

### 3.1 Student dashboard

The dashboard shows:

- **IT Knowledge Map** — your strength across the seven IT domains.
- **AI Academic Advisor** — a short AI recommendation based on your grades and target career.

Click **Analyze My Career Path** in the AI Academic Advisor card to generate advice.

### 3.2 Roadmap page

1. Click **Roadmap** in the sidebar.
2. The page shows the **BSIT Roadmap**.
3. Use the legend to understand each color:
   - **Completed** — passed or finished.
   - **In Progress** — currently being taken.
   - **Available** — open for you to take.
   - **Failed / Retake** — failed and needs another attempt.
   - **Locked** — you must finish a prerequisite first.
4. Drag the canvas to move around.
5. Scroll to zoom.
6. Click a subject card to open its course roadmap.

### 3.3 Course roadmap

1. Open a subject from the roadmap or from the Subjects page.
2. The header shows the subject code, title, credits, and your section (for example, BSIT 1A).
3. The roadmap shows modules, topics, quizzes, materials, and coursework.
4. Locked nodes cannot be opened until their prerequisites are completed.
5. Click a node to open its details.
6. Inside the node you can:
   - Read the overview and learning objectives.
   - Open recommended resources.
   - Mark the topic as **In Progress** or **Completed**.
   - Take a linked quiz.

### 3.4 Final exam

If a final exam is available, a **Take Final Exam** button appears in the course header.

- The section’s own final exam is used first.
- If the section has no exam, the course-wide final exam is used.
- Answer every question, then submit.
- Your score and grade are saved automatically.

### 3.5 Subjects page

1. Click **Subjects** in the sidebar.
2. Use the search box to find a subject by code or title.
3. Click **View Syllabus & AI Tutor** to open the roadmap.

### 3.6 Discovery page

1. Click **Discovery** in the sidebar.
2. The page shows career paths and the domains each career needs.
3. The bar shows your current score.
4. The marker shows the target score.
5. Use this page to see which domains you still need to improve.

### 3.7 AI tutor

Inside a course roadmap, click **Ask AI Tutor**.

You can ask questions about the current subject. The tutor uses the subject’s syllabus as context.

### 3.8 Student profile

1. Click **Profile** in the sidebar.
2. The page shows:
   - Your name, course/program, year level, and section.
   - The current academic year and term.
   - Study hours, completed subjects, streak, and overall progress.
   - IT domain proficiency.
   - Achievements.
   - The theme selector.
3. Click **Edit Profile** to change your name or avatar initials.
4. Under **Appearance**, choose a theme:
   - Calm
   - Ocean
   - Forest
   - Plum
   - Sunset
   - Midnight
   - Classic
5. Your theme is saved on the current device.

---

## 4. Professor guide

### 4.1 My Teaching

1. Sign in as a professor.
2. The **My Teaching** page shows every class assigned to you.
3. Each card shows:
   - Subject code and title
   - Section, such as BSIT 1A
   - Academic year and term
   - Join code
   - Number of students
4. Use **Preview published** to see what students see.
5. Use **Build roadmap** to edit the subject roadmap.

### 4.2 Roadmap builder basics

The builder edits a **draft**. Students only see the **published** version.

The top bar shows:

- Draft revision number
- Last published time
- **Preview published**
- **Auto arrange**
- **Save draft**
- **+ Add node**
- **Publish changes**

### 4.3 Move around the builder

- **Space + drag** — pan the canvas.
- **Middle-mouse drag** — pan the canvas.
- **Scroll** — zoom.
- **Left-drag empty canvas** — select multiple nodes.
- **Drag a node** — move it.
- **Right-click a node** — select it.

### 4.4 Add a node

1. Click **+ Add node**.
2. Choose a node type:
   - Section / Module
   - Topic
   - Quiz
   - Material
   - Coursework
3. Enter a title.
4. Fill in the description, overview, content, objectives, time, and resource.
5. For a quiz node, choose the linked quiz.
6. Click **Add node**.

### 4.5 Use AI to write a node

1. Open a node.
2. Click **Write with AI**.
3. The AI reads:
   - The node title
   - The subject and course details
   - The full roadmap outline
   - Up to six preceding nodes
4. It fills in the description, overview, content, objectives, time, and resource.
5. Review the text.
6. Click **Save node**.

### 4.6 Connect nodes

1. Find the small dot at the bottom of a node.
2. Drag from that dot to the top dot of another node.
3. The system blocks:
   - A node connecting to itself
   - Duplicate connections
   - Cycles (a link that loops back)

### 4.7 Delete a connection

1. Click the connection line.
2. It turns red and gets thicker.
3. Either:
   - Press **Delete** or **Backspace**, or
   - Click the red **Delete connection** button on the line.

### 4.8 Edit or delete a node

1. Click the node.
2. Change its details.
3. Click **Save node**, or click **Delete node**.

### 4.9 Auto arrange

1. Click **Auto arrange**.
2. The system lays out the graph cleanly.
3. The view zooms to fit the graph.
4. The new positions are saved to the draft.

### 4.10 Save and publish

- **Save draft** keeps changes private.
- **Publish changes** makes the draft visible to students.
- If another editor changed the draft first, the system warns you to reload before saving again.

---

## 5. Administrator guide

### 5.1 Admin Panel

After signing in, the administrator sees the **Admin Panel**, not the student sidebar.

The panel gives one-click access to:

- Students
- Add users
- Subjects
- Classes
- Program stats
- Appearance/profile

It also shows:

- Student, professor, subject, class, and enrollment totals.
- Recent classes.
- Items that need attention:
  - Classes with no professor
  - Classes with no students
  - Subjects with no class
  - Students with no enrollment

### 5.2 Stats page

Click **Stats** in the top navigation.

The stats page shows:

- Total students, professors, subjects, classes, and enrollments.
- Published roadmaps.
- Coverage and health bars.
- Student mix by course.
- Students by year level.
- Enrollment status.
- Largest classes.
- Top rosters.

Use this page to spot missing professors, empty classes, and subjects without roadmaps.

### 5.3 Subjects

1. Click **Subjects**.
2. The table lists all subjects.
3. Click **Add Subject** to create one.
4. Each subject has:
   - Subject code
   - Title
   - Description
   - Credits
   - Level
   - Category
   - Year level
   - Semester
   - Prerequisite
5. The **Year level** and **Semester** fields are important. Classes use them automatically.
6. Click **Build Roadmap** to edit the subject roadmap.
7. Click **Classes** to see classes for that subject.

### 5.4 Classes

A class is one subject assigned to one section.

1. Click **Classes**.
2. The table shows:
   - Subject
   - Section
   - Academic year
   - Term
   - Professors
   - Students
   - Join code
3. Click **Create a class** to add one.
4. Choose:
   - Subject
   - Course (BSIT, BSCpE, BSIE)
   - Section letter
   - Academic year
5. The year level and term come from the subject automatically.
6. The system shows the generated section, such as **BSIT 1A**, and the join code.
7. Click **Create class**.

#### Class validation rules

The system rejects a class when:

- The subject has no year level or semester.
- The same subject, section, academic year, and term already exist.
- The class year level does not match the subject year level.
- The class term does not match the subject semester.
- The academic year is not two consecutive years, such as 2026–2027.
- Another class already uses the same join code.

Different sections for the same subject are allowed: BSIT 1A, BSIT 1B, BSIT 1C, and so on.

### 5.5 Inside a class

Click a class to open it.

#### Section details

- Edit the course, section letter, academic year, and join code.
- Year level and term are read-only because they come from the subject.
- The join code can be copied or regenerated.

#### Assigned professors

1. Choose a professor.
2. Click **Assign professor**.
3. Use **Remove** to unassign.
4. Any assigned professor can edit the shared subject roadmap.

#### Enrolled students

1. Paste student emails into the bulk box.
2. Separate emails with new lines, commas, or semicolons.
3. Click **Enroll students**.
4. The system reports:
   - Enrolled
   - Already enrolled
   - No student account
   - Already enrolled in this course in another section
5. Use **Remove** to unenroll a student.
6. Use **Download roster CSV** to export the class list.

#### Final exam

1. The class uses the course-wide final exam if it has no section exam.
2. To give the section its own final exam:
   - Start from a course-wide exam or a blank exam.
   - Enter the title and passing score.
   - Click **Create section exam**.
3. Questions are copied from the selected template.
4. Use **Delete section exam** to remove it.

### 5.6 Students

1. Click **Students**.
2. The list shows each student’s:
   - Name
   - Email
   - Course/program
   - Year and section
3. Click a student to open their page.
4. On the student page you can:
   - Update year level, course, and section.
   - See current enrollments.
   - Enroll the student in a class.

### 5.7 Add users

1. Click **Add users**.
2. Choose **Add One User** or **Import CSV**.

#### Add one user

1. Enter full name and email.
2. Choose **Student** or **Professor**.
3. For a student, choose:
   - Year level
   - Course
   - Section
4. Click **Create Account**.
5. Copy the temporary password immediately. It is shown only once.

#### Import CSV

The CSV can include:

```csv
full_name,email,year_level,course,section,role
```

Example:

```csv
"Alyssa Mercado",alyssa.mercado@student.edu,3,BSIT,A,student
```

- `full_name` and `email` are required.
- `course` accepts BSIT, BSCpE, or BSIE.
- `section` accepts A–F.
- `role` accepts `student` or `professor`.
- The system shows a preview before import.
- Download the blank template from the import page.

### 5.8 Academic year and term

- Each class has an academic year and term.
- Existing classes were cleaned up and standardized.
- The current academic year and term are shown in the top navigation and on the profile page.
- Use the class’s **Section details** card to correct the academic year, term, section, or join code.

### 5.9 Profiles and themes

1. Click **Profile** in the top navigation.
2. Administrators see:
   - Name, email, administrator badge.
   - Current academic year and term.
   - Profile statistics.
   - Theme selector.
3. Use **Edit Profile** to change name or initials.
4. Choose a theme under **Appearance**.

---

## 6. Common messages and what they mean

| Message | Meaning | What to do |
|---|---|---|
| “That class already exists…” | Same subject, section, academic year, and term already exist | Choose another section, year, or term |
| “Class term must match the subject semester” | The subject’s semester does not match the class term | Edit the subject semester |
| “Class year level must match the subject year level” | The class year does not match the subject year | Edit the subject year level |
| “Use an academic year with two consecutive years” | The academic year format is wrong | Use a format like 2026–2027 |
| “A student with this email already exists” | The email is already registered | Use another email or find the existing account |
| “Already enrolled in this course in another section” | The student already has this subject | The student cannot take the same subject twice |
| “This draft was changed in another session” | Another editor saved first | Reload the builder and try again |
| “You do not have permission…” | Your role does not allow the action | Ask an administrator |

---

## 7. Quick page guide

| Page | Who can use it | Purpose |
|---|---|---|
| `/login` | Everyone | Sign in |
| `/` | Student | Dashboard and AI advisor |
| `/roadmap` | Student | Main BSIT roadmap |
| `/roadmap/course/[id]` | Student | Subject roadmap and AI tutor |
| `/courses` | Everyone | Subject library |
| `/discovery` | Student | Career paths |
| `/profile` | Everyone | Profile, stats, theme |
| `/teacher` | Professor | Assigned classes |
| `/admin` | Administrator | Admin panel |
| `/admin/stats` | Administrator | Program statistics |
| `/admin/courses` | Administrator | Subject management |
| `/admin/sections` | Administrator | Class management |
| `/admin/students` | Administrator | Student management |
| `/admin/students/new` | Administrator | Add users and CSV import |
| `/admin/courses/[id]/roadmap` | Admin or assigned professor | Roadmap builder |

---

## 8. Troubleshooting

- **The page looks empty** — wait for the data to load, then refresh.
- **The graph is too small** — scroll to zoom, or click the fit-view control.
- **A student cannot see a new roadmap change** — the professor must click **Publish changes**.
- **A professor cannot open the builder** — confirm the professor is assigned to a class for that subject.
- **A student is locked out of a topic** — finish the prerequisite node first.
- **The theme is not changing** — the theme is stored per browser. Make sure the browser allows local storage.
- **AI is slow or unavailable** — try again later. The AI depends on the Groq service.
- **A CSV import fails** — check the required columns and use the downloadable template.
