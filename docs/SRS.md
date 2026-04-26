# SchoolSage Software Requirements Specification (SRS)

## 1. Product Overview

SchoolSage is a K-12 SaaS web application that predicts and visualizes student mastery of Common Core State Standards for Math. Teachers input assessment data and receive ML-powered mastery predictions visualized on an interactive force graph.

### 1.1 Users & Roles

- **Admin**: Manages school, teachers, students, and classes. Manually provisioned (contact product owner for account).
- **Teacher**: Main user. Views classes, enters assessments, triggers predictions, views mastery visualizations.
- **Student**: Data record only — no login, no access to the application.

### 1.2 Key Decisions

- Level 4 mastery color: Blue (#2563EB)
- Standards storage: Bundled static JSON in frontend + Lambda
- Prediction storage: One DynamoDB record per prediction run with results map
- Batch prediction: Single student only for MVP
- Self-signup: Keep functional during development, disable before production
- Force graph default view: Start zoomed into selected student's grade level
- Class term format: Freeform text
- Agentic AI interventions: Post-MVP

---

## 2. Functional Requirements

### 2.1 Authentication & Authorization

- **FR-AUTH-1**: Users authenticate via email/password or OAuth (Google, Microsoft).
- **FR-AUTH-2**: Three roles exist: admin, teacher, student (student has no login).
- **FR-AUTH-3**: After login, admins are redirected to `/admin`; teachers to `/classes`.
- **FR-AUTH-4**: Route guards prevent cross-role access (teacher cannot access admin pages and vice versa).
- **FR-AUTH-5**: Admin accounts are manually provisioned by the product owner.
- **FR-AUTH-6**: Teachers get accounts via admin invite (email link) or admin direct creation.
- **FR-AUTH-7**: A forgot-password flow must exist (currently referenced but not implemented).
- **FR-AUTH-8**: Session expiry displays a notification and redirects to login.

### 2.2 School Management

- **FR-SCH-1**: An admin can create a school with: name, district, state, address.
- **FR-SCH-2**: An admin can update their school's information.
- **FR-SCH-3**: A first-time admin (no school) is guided through a school setup wizard.
- **FR-SCH-4**: A teacher belongs to exactly one school.
- **FR-SCH-5**: An admin can only manage resources within their own school.

### 2.3 Teacher Management

- **FR-TCH-1**: An admin can create a teacher account directly (first name, last name, email, temporary password).
- **FR-TCH-2**: An admin can invite a teacher via email. The teacher receives a link to complete registration.
- **FR-TCH-3**: An admin can list all teachers in the school with search and pagination.
- **FR-TCH-4**: An admin can deactivate a teacher (soft delete — disables login, preserves data).
- **FR-TCH-5**: An admin can import teachers via CSV (email, first_name, last_name).

### 2.4 Student Management

- **FR-STU-1**: An admin can create a student record (first name, last name, grade level, optional external ID).
- **FR-STU-2**: An admin can update a student's information.
- **FR-STU-3**: An admin can delete a student (cascades: removes class memberships and assessments).
- **FR-STU-4**: An admin can list all students with filtering by grade level and search by name.
- **FR-STU-5**: An admin can import students via CSV (first_name, last_name, grade_level, external_id).
- **FR-STU-6**: A student can be in multiple classes.
- **FR-STU-7**: Students are data records only — they have no accounts or application access.
- **FR-STU-8**: A teacher can view students in their own classes.

### 2.5 Class Management

- **FR-CLS-1**: An admin can create a class with: name, term (freeform text), grade level, assigned teacher.
- **FR-CLS-2**: An admin can update a class (name, term, grade level, teacher assignment).
- **FR-CLS-3**: An admin can delete a class (removes student-class associations, preserves student and assessment records).
- **FR-CLS-4**: An admin can add and remove students from a class roster.
- **FR-CLS-5**: An admin can import classes via CSV (name, term, grade_level, teacher_email, student_external_ids).
- **FR-CLS-6**: A teacher can view their own assigned classes.
- **FR-CLS-7**: A class has exactly one teacher.
- **FR-CLS-8**: A class has one or more students.

### 2.6 Assessments

- **FR-ASM-1**: A teacher can manually enter an assessment: select student, select standard, score (0-4), date.
- **FR-ASM-2**: A teacher can import assessments via CSV (student_id, date, standard, score).
- **FR-ASM-3**: Assessments use a 0-4 mastery scale (single score per standard per student per date).
- **FR-ASM-4**: If an assessment already exists for the same student + date + standard, the score is updated (upsert).
- **FR-ASM-5**: A teacher can only enter assessments for students in their own classes.
- **FR-ASM-6**: Assessment date cannot be in the future.
- **FR-ASM-7**: Standard must be a valid Common Core Math standard ID.
- **FR-ASM-8**: A teacher can view assessment history for a student, filterable by standard and date range.

### 2.7 Standards

- **FR-STD-1**: The system uses Common Core State Standards for Math (K-12).
- **FR-STD-2**: The standards dataset is provided as JSON, including standard IDs, descriptions, grade levels, domains, clusters, and inter-standard relationships.
- **FR-STD-3**: Relationships between standards include: prerequisite, progression, and related.
- **FR-STD-4**: Standards are read-only reference data (not user-editable).
- **FR-STD-5**: Any authenticated user can view standards data.

### 2.8 Predictions

- **FR-PRD-1**: A teacher can trigger a mastery prediction for a single selected student (MVP scope).
- **FR-PRD-2**: The prediction model uses XGBoost and runs on AWS SageMaker.
- **FR-PRD-3**: Input: all current and historical assessments for the student.
- **FR-PRD-4**: Output: predicted mastery level (0-4) for all standards up to and including the student's grade level, with confidence scores.
- **FR-PRD-5**: Predictions are generated for all standards in scope, regardless of whether the standard has been assessed.
- **FR-PRD-6**: The "Run Prediction" button is disabled when no student is selected or the student has zero assessments.
- **FR-PRD-7**: If the student has zero assessments, the system returns "insufficient data" without calling the model.
- **FR-PRD-8**: If data is not in proper format, the user receives an error before the prediction starts.
- **FR-PRD-9**: Prediction history is retained (not overwritten). Each run creates a new record.
- **FR-PRD-10**: The teacher can view prediction history for a student.

### 2.9 Force Graph Visualization

- **FR-VIS-1**: The class view displays a D3.js force-directed graph per student.
- **FR-VIS-2**: Nodes represent Common Core Math standards. Edges represent relationships between standards.
- **FR-VIS-3**: Node color represents mastery level using 4 distinct colors plus gray for unevaluated.
- **FR-VIS-4**: Mastery levels and colors:
  - Not Yet Evaluated: #D1D5DB (gray)
  - 0 — No Understanding: #DC2626 (red)
  - 1 — Minimal: #F97316 (orange)
  - 2 — Partial: #EAB308 (yellow)
  - 3 — Proficient: #22C55E (green)
  - 4 — Advanced: #2563EB (blue)
- **FR-VIS-5**: Assessed mastery is visually distinguished from predicted mastery (solid vs dashed node border).
- **FR-VIS-6**: The graph defaults to the selected student's grade level, with the ability to zoom out to other grades.
- **FR-VIS-7**: Hover on a node shows: standard code, description, mastery level, source (assessed/predicted), last assessed date.
- **FR-VIS-8**: Click on a node shows: full standard description, assessment history, option to add an assessment.
- **FR-VIS-9**: The graph supports zoom, pan, and a reset-view button.
- **FR-VIS-10**: A grade-level filter allows showing only standards for a specific grade range.
- **FR-VIS-11**: A collapsible legend shows all mastery colors and assessed vs predicted distinction.
- **FR-VIS-12**: When no student is selected, the graph shows all nodes in gray with a prompt: "Select a student to view mastery data."
- **FR-VIS-13**: After a prediction completes, the graph updates in place with smooth color transitions.
- **FR-VIS-14**: During prediction, a loading overlay is shown on the graph.

### 2.10 CSV Import (General)

- **FR-CSV-1**: All CSV files must be UTF-8 encoded with a header row.
- **FR-CSV-2**: Imports use a partial success model: valid rows are imported, invalid rows are returned with row numbers and error messages.
- **FR-CSV-3**: Client-side preview shows the first 10 rows with per-row validation before upload.
- **FR-CSV-4**: A drag-and-drop upload interface with file browser fallback is provided.

### 2.11 Teacher Class View (Core Screen)

- **FR-TCV-1**: The class view has three zones: top navbar, toggleable left panel, and force graph area.
- **FR-TCV-2**: The left panel (toggleable) contains: scrollable student list (alphabetical), search/filter, and selected student info.
- **FR-TCV-3**: Clicking a student in the left panel selects them and updates the force graph.
- **FR-TCV-4**: Selected student info shows: name, grade, overall mastery average, standards assessed count, last assessment date.
- **FR-TCV-5**: The navbar contains: back arrow to classes list, class name, "Add Assessment" button, "Run Prediction" button, profile icon.
- **FR-TCV-6**: Assessment entry is available via manual form (modal) or CSV upload.
- **FR-TCV-7**: After saving an assessment, the corresponding graph node updates immediately.

### 2.12 Admin Dashboard

- **FR-ADM-1**: The admin dashboard shows summary cards: total teachers, total students, total classes.
- **FR-ADM-2**: Quick-action buttons link to: add teacher, add class, import data.
- **FR-ADM-3**: Admin pages use a left sidebar for navigation: Dashboard, School, Teachers, Students, Classes.

---

## 3. Non-Functional Requirements

- **NFR-1**: Target prediction latency: <5 seconds per student (excluding SageMaker cold start).
- **NFR-2**: SageMaker cold start (scale from zero) may take up to 5 minutes. Frontend must handle this gracefully.
- **NFR-3**: CSV imports: Teachers max 500 rows/1MB, Students max 2000 rows/2MB, Classes max 500 rows/1MB, Assessments max 10000 rows/5MB.
- **NFR-4**: All user input validated at system boundaries.
- **NFR-5**: No secrets or credentials in source code.
- **NFR-6**: Mastery colors must meet WCAG 2.1 AA contrast requirements.
- **NFR-7**: Prediction rate limiting: max 5 requests per teacher per minute.

---

## 4. Out of Scope (MVP)

- Agentic AI intervention suggestions
- Batch prediction (entire class at once)
- Third-party integrations (Google Classroom, Canvas, SIS)
- Push notifications (email, SMS)
- Student-facing features
- Multi-school admin
- Disabling self-signup (development convenience; disable before production)
