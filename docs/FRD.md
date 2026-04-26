# SchoolSage Functional Requirements Document (FRD)

## 1. Introduction

### 1.1 Purpose

This document defines the functional behavior of SchoolSage from the user's perspective. It describes what the system does, how users interact with it, and the acceptance criteria for each feature. For technical implementation details (data models, APIs, infrastructure), see [SRS.md](./SRS.md) and [DESIGN.md](./DESIGN.md).

### 1.2 Product Summary

SchoolSage is a K-12 SaaS web application that helps teachers understand and predict student mastery of Common Core State Standards for Math. Teachers enter assessment scores, the system uses machine learning to predict mastery of unassessed standards, and results are visualized on an interactive force graph.

### 1.3 Users & Personas

| Role | Description | Goals |
|------|-------------|-------|
| **Admin** | School administrator. Provisioned by the product owner. | Set up and manage school data: teachers, students, classes. Keep rosters accurate. |
| **Teacher** | Primary user. Account created by admin (invite or direct). | Enter assessment data, view mastery predictions, identify which standards students are struggling with. |
| **Student** | Data record only. No application access. | N/A — represented as data managed by admins and teachers. |

### 1.4 Business Goals

- **BG-1**: Give teachers a data-driven view of which standards each student has mastered and which need attention.
- **BG-2**: Use ML predictions to surface mastery gaps before they become visible through assessments alone.
- **BG-3**: Reduce the time teachers spend manually tracking and cross-referencing assessment data.
- **BG-4**: Provide admins a streamlined way to manage school data (teachers, students, classes) including bulk import.

---

## 2. Use Cases

### UC-1: Admin Onboarding

**Actor**: Admin
**Precondition**: Admin has been provisioned by the product owner and has login credentials.
**Trigger**: Admin logs in for the first time.

**Main Flow**:
1. Admin navigates to the application and logs in with email/password or OAuth.
2. System detects no school is associated with the admin's account.
3. System presents a school setup wizard.
4. Admin enters school name, district, state, and address.
5. Admin reviews and confirms.
6. System creates the school and redirects admin to the admin dashboard.

**Alternate Flow**:
- 4a. Admin enters invalid state code → system shows validation error, admin corrects.

**Postcondition**: School exists. Admin sees the admin dashboard and can begin managing teachers, students, and classes.

---

### UC-2: Admin Invites a Teacher

**Actor**: Admin
**Precondition**: School has been set up (UC-1 complete).
**Trigger**: Admin wants to add a teacher to the school.

**Main Flow (Invite)**:
1. Admin navigates to Teachers management page.
2. Admin clicks "Invite Teacher".
3. Admin enters teacher's email, first name, and last name.
4. System sends an invitation email with a registration link.
5. Teacher appears in the list with "Invited" status.
6. Teacher receives email, clicks link, completes registration.
7. Teacher status changes to "Active".

**Alternate Flow (Direct Create)**:
1. Admin clicks "Create Teacher" instead.
2. Admin enters first name, last name, email.
3. System creates the account with a temporary password and displays it to the admin once.
4. Teacher appears in the list with "Active" status.
5. Admin communicates the temporary password to the teacher out-of-band.
6. Teacher logs in and is prompted to change password.

**Alternate Flow (CSV Import)**:
1. Admin clicks "Import CSV".
2. Admin uploads a CSV file (columns: email, first_name, last_name).
3. System previews the first 10 rows with validation status per row.
4. Admin confirms import.
5. System creates accounts and sends invitation emails for valid rows.
6. System reports: "X teachers imported, Y errors" with per-row error details.

**Postcondition**: Teacher account exists. Teacher can log in and access their classes.

---

### UC-3: Admin Creates Students

**Actor**: Admin
**Precondition**: School exists.
**Trigger**: Admin needs to add students to the system.

**Main Flow (Single)**:
1. Admin navigates to Students management page.
2. Admin clicks "Add Student".
3. Admin enters first name, last name, grade level (K-12), and optional external student ID.
4. System creates the student record.
5. Student appears in the list.

**Alternate Flow (CSV Import)**:
1. Admin clicks "Import CSV".
2. Admin uploads CSV (columns: first_name, last_name, grade_level, external_id).
3. System previews rows with validation.
4. If an external_id matches an existing student, system updates rather than duplicates.
5. Admin confirms. System reports import results.

**Postcondition**: Student records exist and can be assigned to classes.

---

### UC-4: Admin Creates a Class and Assigns Roster

**Actor**: Admin
**Precondition**: At least one teacher and one student exist in the school.
**Trigger**: Admin needs to set up a class for a term.

**Main Flow**:
1. Admin navigates to Classes management page.
2. Admin clicks "Create Class".
3. Admin enters: class name, term (freeform text, e.g., "Fall 2026"), grade level, and selects a teacher from a dropdown.
4. System creates the class.
5. Admin navigates to the class's roster management.
6. Admin clicks "Add Students" and selects one or more students from a multi-select list.
7. System adds students to the class.

**Alternate Flow (CSV Import)**:
1. Admin imports classes via CSV (columns: name, term, grade_level, teacher_email, student_external_ids).
2. System resolves teacher by email and students by external IDs.
3. Unresolvable teacher emails cause the row to fail. Unresolvable student IDs are reported as warnings (class still created).

**Postcondition**: Class exists with a teacher and students. Teacher can see the class in their class list.

---

### UC-5: Teacher Views Their Classes

**Actor**: Teacher
**Precondition**: Teacher has an active account and is assigned to at least one class.
**Trigger**: Teacher logs in.

**Main Flow**:
1. Teacher logs in with email/password or OAuth.
2. System redirects to the "My Classes" page.
3. Teacher sees a grid of class cards, each showing: class name, grade level, term, and student count.
4. Teacher clicks a class card.
5. System navigates to the class view (force graph screen).

**Alternate Flow (No Classes)**:
- 3a. Teacher has no assigned classes → system shows: "You don't have any classes yet. Your administrator will assign classes to you."

**Postcondition**: Teacher is viewing the class view for the selected class.

---

### UC-6: Teacher Enters Assessments Manually

**Actor**: Teacher
**Precondition**: Teacher is in the class view with a student selected.
**Trigger**: Teacher has assessment scores to enter.

**Main Flow**:
1. Teacher clicks "Add Assessment" in the class view navbar.
2. System opens a modal with fields:
   - Student: pre-filled with the currently selected student.
   - Standard: searchable dropdown of all Common Core Math standards (by code and name).
   - Score: radio buttons for 0, 1, 2, 3, 4.
   - Date: date picker, defaults to today.
3. Teacher fills in the fields and clicks "Submit".
4. System saves the assessment.
5. The corresponding node on the force graph immediately updates its color to reflect the new score.
6. Modal closes. Toast notification confirms: "Assessment saved."

**Alternate Flow (From Node Click)**:
1. Teacher clicks a standard node on the force graph.
2. Detail panel shows the standard info.
3. Teacher clicks "Add Assessment" in the detail panel.
4. Modal opens with both student and standard pre-filled.

**Alternate Flow (Upsert)**:
- If an assessment already exists for the same student + standard + date, the score is updated rather than duplicated.

**Validation Rules**:
- All fields are required.
- Date cannot be in the future.
- Score must be 0-4.
- Standard must be a valid Common Core Math standard ID.

**Postcondition**: Assessment is saved. Force graph node reflects the new mastery level.

---

### UC-7: Teacher Imports Assessments via CSV

**Actor**: Teacher
**Precondition**: Teacher is in the class view.
**Trigger**: Teacher has a batch of assessment scores to enter.

**Main Flow**:
1. Teacher clicks "Import CSV" in the class view navbar.
2. System opens a CSV upload modal with drag-and-drop zone.
3. Teacher uploads a CSV file with columns: `student_id, date, standard, score`.
4. System parses the file and shows a preview of the first 10 rows with per-row validation:
   - Green check: valid row.
   - Red X: invalid row with error message (unknown student_id, invalid standard, score out of range, future date).
5. System shows summary: "X valid rows, Y errors."
6. Teacher clicks "Import".
7. System imports all valid rows. If a row matches an existing student+date+standard, the score is updated.
8. Progress indicator shows during upload.
9. On completion: toast notification "X assessments imported." Force graph refreshes for the currently selected student.

**Alternate Flow (All Rows Invalid)**:
- Import button is disabled. Teacher must fix CSV and re-upload.

**Postcondition**: Assessments are saved. Graph reflects any new scores for the selected student.

---

### UC-8: Teacher Runs a Mastery Prediction

**Actor**: Teacher
**Precondition**: Teacher is in the class view with a student selected who has at least one assessment.
**Trigger**: Teacher wants to see predicted mastery for all standards.

**Main Flow**:
1. Teacher clicks "Run Prediction".
2. System shows a loading overlay on the graph: "Running predictions..."
3. System sends the student's assessment data to the ML model.
4. ML model returns predicted mastery levels (0-4) for all standards up to the student's grade level, with confidence scores.
5. Graph re-renders:
   - Assessed standards keep their solid-border colored nodes.
   - Predicted standards appear with dashed-border colored nodes.
   - Color transitions animate smoothly.
6. Toast notification: "Prediction complete for [Student Name]."

**Alternate Flow (No Assessments)**:
- "Run Prediction" button is disabled with tooltip: "Enter at least one assessment to run predictions."

**Alternate Flow (Model Warming Up)**:
- If the ML model is cold-starting (first use of the day), the loading message changes to: "The prediction model is warming up. This may take a few minutes."
- System retries automatically.

**Alternate Flow (Prediction Fails)**:
- Toast notification: "Prediction failed for [Student Name]. Please try again."
- Graph retains its previous state (no data is cleared).

**Postcondition**: Predicted mastery levels are displayed on the graph. Prediction is saved to history.

---

### UC-9: Teacher Explores the Force Graph

**Actor**: Teacher
**Precondition**: Teacher is in the class view with a student selected.
**Trigger**: Teacher wants to explore mastery data visually.

**Main Flow**:
1. Teacher sees the force graph with nodes colored by mastery level.
2. Teacher hovers over a node → tooltip shows:
   - Standard code and full description
   - Mastery level (text + numeric)
   - Source: "Assessed" or "Predicted"
   - Last assessed date (or "Not yet assessed")
3. Teacher clicks a node → detail panel shows:
   - Full standard and cluster description
   - Assessment history (date + score for each entry)
   - Button to add a new assessment for this standard
4. Teacher uses mouse wheel to zoom in/out (0.3x to 5x range).
5. Teacher click-drags on empty space to pan.
6. Teacher clicks "Reset View" to return to default zoom and position.
7. Teacher uses grade-level filter dropdown to show only standards for a specific grade range (e.g., "3-5", "K-2", or "All").

**Graph Default State (No Student Selected)**:
- All nodes are gray.
- Overlay message: "Select a student to view mastery data."

**Postcondition**: Teacher has explored the student's mastery landscape and identified areas of strength and weakness.

---

### UC-10: Teacher Selects a Student

**Actor**: Teacher
**Precondition**: Teacher is in the class view.
**Trigger**: Teacher wants to view a specific student's mastery.

**Main Flow**:
1. Left panel shows an alphabetical list of all students in the class.
2. Each student row shows: full name and a small mastery summary indicator (colored dot or mini bar).
3. Teacher types in the search box to filter students by name.
4. Teacher clicks a student name.
5. Selected student is visually highlighted.
6. Student info section updates: name, grade, overall mastery average, count of standards assessed vs total, last assessment date.
7. Force graph updates to show the selected student's mastery data, zoomed into the student's grade level.

**Alternate Flow (Toggle Panel)**:
- Teacher clicks the panel toggle button → left panel slides closed, graph expands to fill the space.
- Teacher clicks toggle again → panel slides open.

**Postcondition**: Force graph shows the selected student's mastery. Student info is visible in the left panel.

---

### UC-11: Admin Manages Teachers

**Actor**: Admin
**Precondition**: School exists.
**Trigger**: Admin needs to view, edit, or remove teachers.

**Main Flow (View)**:
1. Admin navigates to Teachers page via sidebar.
2. System shows a table with columns: Name, Email, Status (Active/Invited/Deactivated), Classes (count).
3. Admin can sort by any column.
4. Admin uses search bar to filter by name or email.
5. Table paginates at 20 rows per page.

**Flow (Edit)**:
1. Admin clicks a row action menu → "Edit".
2. Modal opens with editable fields: first name, last name. Email is read-only.
3. Admin saves changes.

**Flow (Deactivate)**:
1. Admin clicks row action → "Deactivate".
2. Confirmation dialog: "Are you sure you want to deactivate [Teacher Name]? They will no longer be able to log in."
3. Admin confirms.
4. Teacher status changes to "Deactivated". Login is disabled. Data is preserved.

**Postcondition**: Teacher list reflects the changes.

---

### UC-12: Admin Manages Students

**Actor**: Admin
**Precondition**: School exists.
**Trigger**: Admin needs to view, edit, or remove students.

**Main Flow (View)**:
1. Admin navigates to Students page via sidebar.
2. Table shows: Name, Grade Level, Classes (comma-separated or count).
3. Sortable, searchable, filterable by grade level. Paginated at 20/page.

**Flow (Edit)**:
1. Admin clicks "Edit" on a student row.
2. Modal: editable first name, last name, grade level, external ID.
3. Admin saves.

**Flow (Remove)**:
1. Admin clicks "Remove" on a student row.
2. Confirmation dialog: "This will remove [Student Name] from all classes and delete their assessment data. This cannot be undone."
3. Admin confirms. Student and associated data are deleted.

**Postcondition**: Student list reflects the changes.

---

### UC-13: Admin Manages Classes

**Actor**: Admin
**Precondition**: School exists with at least one teacher.
**Trigger**: Admin needs to create, edit, or manage class rosters.

**Main Flow (View)**:
1. Admin navigates to Classes page via sidebar.
2. Table shows: Class Name, Teacher, Grade Level, Student Count.
3. Sortable, searchable, filterable.

**Flow (Create)**:
1. Admin clicks "Create Class".
2. Modal: class name, grade level (dropdown), term (text), teacher (searchable dropdown of active teachers).
3. Admin submits. Class appears in list.

**Flow (Manage Roster)**:
1. Admin clicks "Manage Roster" on a class row.
2. System navigates to the roster page showing current students.
3. Admin clicks "Add Students" → multi-select modal shows all school students not already in the class.
4. Admin selects students and confirms.
5. Admin can remove individual students with a "Remove" button per row (with confirmation).

**Flow (Delete Class)**:
1. Admin clicks "Delete" on a class row.
2. Confirmation: "Delete [Class Name]? Students will be removed from this class but their records will be preserved."
3. Admin confirms. Class and roster associations are deleted.

**Postcondition**: Class list and rosters reflect the changes.

---

### UC-14: Admin Views Dashboard

**Actor**: Admin
**Precondition**: Admin is logged in with a school set up.
**Trigger**: Admin navigates to the dashboard (default after login).

**Main Flow**:
1. Dashboard shows summary cards: total teachers, total students, total classes.
2. Quick-action buttons: "Add Teacher", "Add Class", "Import Data".
3. Admin clicks any quick-action to navigate to the relevant management page.

**Postcondition**: Admin has an overview of school data and can navigate to any management function.

---

### UC-15: User Resets Password

**Actor**: Teacher or Admin
**Precondition**: User has a registered account.
**Trigger**: User has forgotten their password.

**Main Flow**:
1. User clicks "Forgot password?" on the login page.
2. System shows a form requesting email.
3. User enters email and clicks "Send Reset Code".
4. System sends a verification code to the email.
5. User enters the verification code and a new password.
6. System validates the code and updates the password.
7. User is redirected to login.

**Validation Rules**:
- Password: 8+ characters, 1 uppercase, 1 lowercase, 1 digit.
- Code must match the one sent to the email.

**Postcondition**: Password is updated. User can log in with the new password.

---

## 3. User Stories with Acceptance Criteria

### 3.1 Authentication

**US-AUTH-1**: As a teacher, I want to log in with my email and password so that I can access my classes.
- **AC-1**: Given valid credentials, system redirects to `/classes`.
- **AC-2**: Given invalid credentials, system shows "Incorrect email or password."
- **AC-3**: Given a deactivated account, system shows "Your account has been deactivated. Contact your administrator."

**US-AUTH-2**: As a teacher, I want to log in with Google or Microsoft so that I don't need a separate password.
- **AC-1**: Clicking "Sign in with Google/Microsoft" redirects to OAuth provider.
- **AC-2**: After successful OAuth, system redirects to `/classes`.
- **AC-3**: If the OAuth email matches an existing account, accounts are linked automatically.

**US-AUTH-3**: As an admin, I want to be redirected to the admin dashboard after login so that I land on the right page for my role.
- **AC-1**: Admin login redirects to `/admin`.
- **AC-2**: Teacher login redirects to `/classes`.

**US-AUTH-4**: As a user, I want to reset my password so that I can regain access if I forget it.
- **AC-1**: "Forgot password?" link on login page navigates to reset form.
- **AC-2**: Valid email receives a reset code.
- **AC-3**: Valid code + valid new password resets the password and redirects to login.
- **AC-4**: Password must meet strength requirements (8+ chars, uppercase, lowercase, digit).

### 3.2 School Management

**US-SCH-1**: As an admin, I want to set up my school when I first log in so that I can start managing my data.
- **AC-1**: First login with no school triggers the setup wizard.
- **AC-2**: Wizard collects: school name, district, state (2-char), address.
- **AC-3**: All fields are required. State must be valid.
- **AC-4**: On completion, admin is redirected to dashboard. Wizard does not appear again.

**US-SCH-2**: As an admin, I want to edit my school's information so that it stays current.
- **AC-1**: School settings page shows current values pre-filled.
- **AC-2**: Changes are saved on submit with success feedback.

### 3.3 Teacher Management

**US-TCH-1**: As an admin, I want to invite a teacher by email so they can create their own account.
- **AC-1**: Entering a valid email sends an invitation.
- **AC-2**: Teacher appears in the list with "Invited" status.
- **AC-3**: Duplicate email (already in school) shows an error.
- **AC-4**: Teacher receives an email with a registration link.

**US-TCH-2**: As an admin, I want to create a teacher account directly so the teacher can log in immediately.
- **AC-1**: Entering first name, last name, email creates the account.
- **AC-2**: A temporary password is generated and shown to the admin once.
- **AC-3**: Teacher appears with "Active" status.
- **AC-4**: Teacher is prompted to change password on first login.

**US-TCH-3**: As an admin, I want to import teachers from a CSV so I can onboard many at once.
- **AC-1**: CSV with columns `email, first_name, last_name` is accepted.
- **AC-2**: Preview shows first 10 rows with validation.
- **AC-3**: Valid rows create accounts; invalid rows are skipped with errors.
- **AC-4**: Summary shows count of imported and failed rows.
- **AC-5**: Max 500 rows, 1MB file size.

**US-TCH-4**: As an admin, I want to deactivate a teacher so they can no longer log in but their data is preserved.
- **AC-1**: Confirmation dialog shown before deactivation.
- **AC-2**: Teacher status changes to "Deactivated".
- **AC-3**: Teacher can no longer log in.
- **AC-4**: Teacher's class assignments and historical data remain intact.

### 3.4 Student Management

**US-STU-1**: As an admin, I want to add a student record so they can be assigned to classes.
- **AC-1**: Form accepts: first name, last name, grade level (K-12), optional external ID.
- **AC-2**: Student appears in the student list after creation.

**US-STU-2**: As an admin, I want to import students from a CSV so I can add many at once.
- **AC-1**: CSV with columns `first_name, last_name, grade_level, external_id` (external_id optional).
- **AC-2**: If external_id matches an existing student, the record is updated (not duplicated).
- **AC-3**: Preview, validation, and summary same as teacher CSV flow.
- **AC-4**: Max 2000 rows, 2MB file size.

**US-STU-3**: As an admin, I want to remove a student so their data is cleaned up.
- **AC-1**: Confirmation dialog warns about data deletion.
- **AC-2**: Student is removed from all class rosters.
- **AC-3**: Student's assessment data is deleted.
- **AC-4**: Action cannot be undone.

**US-STU-4**: As a teacher, I want to see students in my class so I know who I'm working with.
- **AC-1**: Teacher can view students in their own classes only.
- **AC-2**: Teacher cannot view students in other teachers' classes.

### 3.5 Class Management

**US-CLS-1**: As an admin, I want to create a class with a name, term, grade, and teacher so it's ready for students.
- **AC-1**: Class name, term (freeform text), grade level, and teacher (dropdown) are required.
- **AC-2**: Teacher must be an active teacher in the school.
- **AC-3**: Class appears in the class list after creation.

**US-CLS-2**: As an admin, I want to add and remove students from a class roster.
- **AC-1**: "Add Students" shows a multi-select of students not already in the class.
- **AC-2**: Students can be in multiple classes simultaneously.
- **AC-3**: Removing a student from a class does not delete the student record or their assessments.

**US-CLS-3**: As an admin, I want to import classes from a CSV so I can set up many at once.
- **AC-1**: CSV columns: `name, term, grade_level, teacher_email, student_external_ids` (semicolon-separated).
- **AC-2**: Teacher email must match an active teacher. Invalid email → row fails.
- **AC-3**: Unresolvable student external IDs are warnings (class still created, those students not added).
- **AC-4**: Max 500 rows, 1MB.

**US-CLS-4**: As a teacher, I want to see only my assigned classes so I'm not overwhelmed with irrelevant data.
- **AC-1**: "My Classes" page shows only classes where the teacher is the assigned teacher.
- **AC-2**: Each card shows: class name, grade level, term, student count.

### 3.6 Assessments

**US-ASM-1**: As a teacher, I want to manually enter an assessment score so I can record how a student performed on a standard.
- **AC-1**: Modal provides: student (pre-filled if selected), standard (searchable dropdown), score (0-4 radio), date (default today).
- **AC-2**: Score is saved and graph node updates color immediately.
- **AC-3**: If same student+standard+date exists, the score is updated (not duplicated).
- **AC-4**: Date cannot be in the future. Standard must be valid.

**US-ASM-2**: As a teacher, I want to import assessments from a CSV so I can enter many scores at once.
- **AC-1**: CSV columns: `student_id, date, standard, score`.
- **AC-2**: Preview shows first 10 rows with per-row validation.
- **AC-3**: Valid rows are imported; invalid rows are skipped with error details.
- **AC-4**: Duplicate student+date+standard rows update the score (upsert).
- **AC-5**: Max 10000 rows, 5MB.
- **AC-6**: Graph refreshes for the currently selected student after import.

**US-ASM-3**: As a teacher, I want to view a student's assessment history so I can see their progress over time.
- **AC-1**: Clicking a node on the graph shows assessment history for that standard.
- **AC-2**: History shows each assessment entry: date and score.
- **AC-3**: Teacher can filter assessments by standard and date range.

### 3.7 Predictions

**US-PRD-1**: As a teacher, I want to run a mastery prediction for a student so I can see which standards they're likely struggling with.
- **AC-1**: "Run Prediction" is disabled when no student is selected.
- **AC-2**: "Run Prediction" is disabled when the student has zero assessments, with tooltip explanation.
- **AC-3**: Clicking "Run Prediction" shows a loading overlay on the graph.
- **AC-4**: On completion, predicted mastery levels appear on the graph with dashed borders (distinct from assessed solid borders).
- **AC-5**: Toast notification confirms completion.
- **AC-6**: Target latency: <5 seconds (excluding cold start).

**US-PRD-2**: As a teacher, I want to distinguish between assessed and predicted mastery so I know which data is real vs estimated.
- **AC-1**: Assessed standards have solid-border nodes.
- **AC-2**: Predicted standards have dashed-border nodes.
- **AC-3**: Legend explains the solid vs dashed distinction.
- **AC-4**: Hover tooltip shows "Assessed" or "Predicted" for each node.

**US-PRD-3**: As a teacher, I want predictions to cover all standards up to the student's grade level so I get a complete picture.
- **AC-1**: Predictions are generated for every standard from K through the student's grade level.
- **AC-2**: Standards already assessed still receive predictions (teacher can compare).
- **AC-3**: Each prediction includes a confidence score.

**US-PRD-4**: As a teacher, I want to see prediction history so I can track how predictions change over time.
- **AC-1**: Each prediction run is saved with a timestamp.
- **AC-2**: Previous predictions are not overwritten.
- **AC-3**: Teacher can view past prediction runs for a student.

### 3.8 Force Graph Visualization

**US-VIS-1**: As a teacher, I want to see standards as nodes on a force graph so I can visually identify mastery patterns.
- **AC-1**: Each node represents one Common Core Math standard.
- **AC-2**: Edges connect related standards (prerequisite, progression, related).
- **AC-3**: Nodes are labeled with standard codes (e.g., "K.CC.1", "3.OA.4").
- **AC-4**: Nodes are grouped/clustered by grade level.

**US-VIS-2**: As a teacher, I want nodes colored by mastery level so I can quickly spot strengths and gaps.
- **AC-1**: Not Yet Evaluated: gray (#D1D5DB).
- **AC-2**: Level 0 (No Understanding): red (#DC2626).
- **AC-3**: Level 1 (Minimal): orange (#F97316).
- **AC-4**: Level 2 (Partial): yellow (#EAB308).
- **AC-5**: Level 3 (Proficient): green (#22C55E).
- **AC-6**: Level 4 (Advanced): blue (#2563EB).

**US-VIS-3**: As a teacher, I want to hover over a node to see details so I don't have to leave the graph view.
- **AC-1**: Tooltip shows: standard code, full description, mastery level, source (assessed/predicted), last assessed date.
- **AC-2**: Hovered node is visually highlighted.
- **AC-3**: Connected nodes and edges are highlighted; unconnected ones dim.

**US-VIS-4**: As a teacher, I want to click a node to see full details and assessment history.
- **AC-1**: Detail panel shows full standard and cluster description.
- **AC-2**: Assessment history is listed (date + score per entry).
- **AC-3**: "Add Assessment" button opens pre-filled assessment modal.
- **AC-4**: Clicking empty space or the same node deselects it.

**US-VIS-5**: As a teacher, I want to zoom and pan the graph so I can focus on specific areas.
- **AC-1**: Mouse wheel/pinch zooms in and out (0.3x to 5x range).
- **AC-2**: Click-and-drag on empty space pans.
- **AC-3**: "Reset View" button restores default zoom and position.

**US-VIS-6**: As a teacher, I want to filter by grade level so I can focus on relevant standards.
- **AC-1**: Dropdown options: "All K-12", "K-2", "3-5", "6-8", "9-12", or individual grades.
- **AC-2**: Filtering hides nodes outside the range with smooth transitions.
- **AC-3**: Default view starts at the selected student's grade level.

**US-VIS-7**: As a teacher, I want a legend so I can understand what the colors and borders mean.
- **AC-1**: Legend is positioned in the bottom-right corner.
- **AC-2**: Shows all 6 color states with labels.
- **AC-3**: Shows assessed (solid) vs predicted (dashed) distinction.
- **AC-4**: Legend is collapsible.

### 3.9 Class View Layout

**US-TCV-1**: As a teacher, I want a toggleable student panel so I can maximize the graph when needed.
- **AC-1**: Panel slides open/closed with smooth animation (~200ms).
- **AC-2**: Graph area resizes dynamically when panel toggles.
- **AC-3**: Panel state persists within the session.

**US-TCV-2**: As a teacher, I want to search for a student in the left panel so I can quickly find them.
- **AC-1**: Search input at the top of the student list.
- **AC-2**: List filters in real-time as the teacher types.
- **AC-3**: Filtering is by first name or last name.

**US-TCV-3**: As a teacher, I want to see selected student info at a glance so I have context while viewing the graph.
- **AC-1**: Panel shows: full name, grade level.
- **AC-2**: Overall mastery average (numeric, e.g., "2.4 / 4.0").
- **AC-3**: Count of standards assessed vs total standards.
- **AC-4**: Last assessment date.

### 3.10 Admin Navigation

**US-NAV-1**: As an admin, I want a sidebar navigation so I can quickly switch between management pages.
- **AC-1**: Sidebar shows: Dashboard, School Settings, Teachers, Students, Classes.
- **AC-2**: Active page is visually highlighted.
- **AC-3**: Sidebar is collapsible on smaller screens.

**US-NAV-2**: As a user, I want a profile dropdown so I can access settings and log out.
- **AC-1**: Profile icon in the top-right of the navbar.
- **AC-2**: Dropdown shows: user name, role badge, "Settings" link, "Logout" button.
- **AC-3**: Dropdown closes on outside click.

---

## 4. System Flows

### 4.1 Teacher Daily Workflow

```
Login → My Classes → Select Class → Select Student → View Graph
  ├── Add Assessment (manual or CSV) → Graph updates
  ├── Run Prediction → Graph updates with predictions
  ├── Explore graph (hover, click, zoom, filter)
  └── Select another student → Graph updates
```

### 4.2 Admin Setup Workflow

```
Login → School Setup Wizard (first time only)
  → Dashboard
    ├── Create/Import Teachers
    ├── Create/Import Students
    ├── Create/Import Classes
    └── Manage Class Rosters (assign students to classes)
```

### 4.3 Assessment → Prediction Flow

```
Teacher enters assessments (manual or CSV)
  → Assessments saved to database
  → Force graph updates assessed nodes immediately
  → Teacher clicks "Run Prediction"
  → System gathers all student assessments
  → ML model predicts mastery for all grade-level standards
  → Predictions saved to database
  → Force graph updates predicted nodes (dashed borders)
  → Teacher explores results
```

---

## 5. Out of Scope (MVP)

| Feature | Status |
|---------|--------|
| Agentic AI intervention suggestions | Post-MVP |
| Batch prediction (entire class) | Post-MVP |
| Third-party integrations (Google Classroom, Canvas) | Post-MVP |
| Push notifications (email, SMS) | Post-MVP |
| Student-facing features | Post-MVP |
| Multi-school admin | Post-MVP |
