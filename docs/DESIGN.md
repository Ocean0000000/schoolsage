# SchoolSage MVP Design Document

This document describes **how** the system implements the requirements defined in [FRD.md](./FRD.md) and [SRS.md](./SRS.md).

---

## 1. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Auth | AWS Cognito (via AWS Amplify client) |
| API | AWS API Gateway (REST) + Cognito JWT authorizer |
| Compute | AWS Lambda (Node.js 22) |
| Database | AWS DynamoDB (single-table design) |
| ML | AWS SageMaker (XGBoost endpoint) |
| Visualization | D3.js force-directed graph |
| IaC | AWS CDK (TypeScript) |

---

## 2. DynamoDB Single-Table Design

### 2.1 Table Configuration

- **Table**: `SchoolSageAITable` (exists, PK/SK String)
- **GSI1**: PK=`GSI1PK` (String), SK=`GSI1SK` (String) — inverted lookups (teacher→classes, student→classes, user by ID)
- **GSI2**: PK=`GSI2PK` (String), SK=`GSI2SK` (String) — email lookups, date-range queries
- All items include `entityType`, `createdAt`, `updatedAt` (ISO-8601)
- IDs use ULIDs (time-sortable, lexicographically ordered)

### 2.2 Entity Schemas

**School**
| Key | Pattern |
|-----|---------|
| PK | `SCHOOL#<schoolId>` |
| SK | `SCHOOL#<schoolId>` |
| Attrs | schoolId, name, district, state (2-char), address, gradeLevelsServed (optional) |

**User (Admin/Teacher)**
| Key | Pattern |
|-----|---------|
| PK | `SCHOOL#<schoolId>` |
| SK | `USER#<userId>` |
| GSI1PK | `USER#<userId>` |
| GSI1SK | `SCHOOL#<schoolId>` |
| GSI2PK | `USER_EMAIL#<email>` |
| GSI2SK | `USER#<userId>` |
| Attrs | userId, cognitoSub, email, firstName, lastName, role ("admin"/"teacher"), schoolId, status ("invited"/"active"/"deactivated") |

**Student** (data record, no auth)
| Key | Pattern |
|-----|---------|
| PK | `SCHOOL#<schoolId>` |
| SK | `STUDENT#<studentId>` |
| GSI1PK | `STUDENT#<studentId>` |
| GSI1SK | `SCHOOL#<schoolId>` |
| Attrs | studentId, schoolId, firstName, lastName, gradeLevel (K=0, 1-12), externalId (optional, for CSV matching) |

**Class**
| Key | Pattern |
|-----|---------|
| PK | `SCHOOL#<schoolId>` |
| SK | `CLASS#<classId>` |
| GSI1PK | `TEACHER#<teacherUserId>` |
| GSI1SK | `CLASS#<classId>` |
| Attrs | classId, schoolId, teacherUserId, name, term, gradeLevel |

**ClassStudent** (many-to-many join)
| Key | Pattern |
|-----|---------|
| PK | `CLASS#<classId>` |
| SK | `STUDENT#<studentId>` |
| GSI1PK | `STUDENT#<studentId>` |
| GSI1SK | `CLASS#<classId>` |
| Attrs | classId, studentId, schoolId |

**Assessment**
| Key | Pattern |
|-----|---------|
| PK | `STUDENT#<studentId>` |
| SK | `ASSESSMENT#<date>#<standardId>` |
| GSI1PK | `CLASS#<classId>` |
| GSI1SK | `ASSESSMENT#<date>#<studentId>` |
| Attrs | assessmentId, studentId, classId, standardId, date, score (0-4), createdByUserId |

**Prediction** (one record per run, results as map)
| Key | Pattern |
|-----|---------|
| PK | `STUDENT#<studentId>` |
| SK | `PREDICTION#<timestamp>` |
| Attrs | predictionId, studentId, modelVersion, status ("pending"/"completed"/"failed"), requestedByUserId, requestedAt, completedAt, results: { [standardId]: { predictedMastery: 0-4, confidence: float } } |

### 2.3 Access Patterns

| ID | Pattern | Keys |
|----|---------|------|
| AP-1 | Get school by ID | PK=SCHOOL#id, SK=SCHOOL#id |
| AP-3 | List users in school | PK=SCHOOL#id, SK begins_with USER# |
| AP-4 | Get user by userId | GSI1: GSI1PK=USER#id |
| AP-5 | Lookup user by email | GSI2: GSI2PK=USER_EMAIL#email |
| AP-7 | List students in school | PK=SCHOOL#id, SK begins_with STUDENT# |
| AP-8 | Get student by ID | GSI1: GSI1PK=STUDENT#id |
| AP-9 | List classes in school | PK=SCHOOL#id, SK begins_with CLASS# |
| AP-10 | List classes for teacher | GSI1: GSI1PK=TEACHER#userId, SK begins_with CLASS# |
| AP-12 | List students in class | PK=CLASS#id, SK begins_with STUDENT# |
| AP-13 | List classes for student | GSI1: GSI1PK=STUDENT#id, SK begins_with CLASS# |
| AP-14 | All assessments for student | PK=STUDENT#id, SK begins_with ASSESSMENT# |
| AP-16 | Assessments in class by date | GSI1: GSI1PK=CLASS#id, SK begins_with ASSESSMENT# |
| AP-20 | Predictions for student | PK=STUDENT#id, SK begins_with PREDICTION# |
| AP-21 | Latest prediction | AP-20 with ScanIndexForward=false, Limit=1 |

---

## 3. API Design

All routes use API Gateway with Cognito JWT authorizer. JWT claims include `custom:role` and `custom:schoolId`. Authorization is enforced in Lambda handlers (role check + resource ownership).

### 3.1 School Endpoints (admin only)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/schools` | Create school |
| GET | `/schools/{schoolId}` | Get school |
| PUT | `/schools/{schoolId}` | Update school |

### 3.2 Teacher Endpoints (admin only)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/schools/{schoolId}/teachers` | Create teacher (+ Cognito account) |
| POST | `/schools/{schoolId}/teachers/invite` | Invite teacher via email |
| GET | `/schools/{schoolId}/teachers` | List teachers (paginated) |
| DELETE | `/schools/{schoolId}/teachers/{userId}` | Soft-deactivate teacher |
| POST | `/schools/{schoolId}/teachers/import` | CSV import |

### 3.3 Student Endpoints (admin CUD, teacher reads own)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/schools/{schoolId}/students` | Create student |
| GET | `/schools/{schoolId}/students` | List students (paginated, filterable) |
| GET | `/schools/{schoolId}/students/{studentId}` | Get student |
| PUT | `/schools/{schoolId}/students/{studentId}` | Update student |
| DELETE | `/schools/{schoolId}/students/{studentId}` | Delete student (cascades) |
| POST | `/schools/{schoolId}/students/import` | CSV import |

### 3.4 Class Endpoints (admin CUD, teacher reads own)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/schools/{schoolId}/classes` | Create class |
| GET | `/schools/{schoolId}/classes` | List classes |
| GET | `/schools/{schoolId}/classes/{classId}` | Get class + students |
| PUT | `/schools/{schoolId}/classes/{classId}` | Update class |
| DELETE | `/schools/{schoolId}/classes/{classId}` | Delete class |
| POST | `/schools/{schoolId}/classes/{classId}/students` | Add students to roster |
| DELETE | `/schools/{schoolId}/classes/{classId}/students/{studentId}` | Remove student from roster |
| POST | `/schools/{schoolId}/classes/import` | CSV import |

### 3.5 Assessment Endpoints (teacher: own classes, admin: all)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/schools/{schoolId}/classes/{classId}/assessments` | Create/upsert assessment |
| GET | `/schools/{schoolId}/classes/{classId}/assessments` | List assessments (filterable) |
| GET | `/schools/{schoolId}/students/{studentId}/assessments` | Student assessment history |
| POST | `/schools/{schoolId}/classes/{classId}/assessments/import` | CSV import |

### 3.6 Standards Endpoints (any authenticated user)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/standards` | All standards (optional gradeLevel filter) |
| GET | `/standards/graph?maxGradeLevel=N` | Graph-formatted nodes + edges |

### 3.7 Prediction Endpoints (teacher: own students, admin: all)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/schools/{schoolId}/students/{studentId}/predictions` | Trigger prediction |
| GET | `/schools/{schoolId}/students/{studentId}/predictions/latest` | Get latest prediction |
| GET | `/schools/{schoolId}/students/{studentId}/predictions` | Prediction history |

### 3.8 User Profile Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Current user info |
| GET | `/me/classes` | Teacher's own classes |

### 3.9 Mastery Endpoint (for force graph)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/schools/{schoolId}/students/{studentId}/mastery` | Combined assessed + predicted mastery per standard |

**Mastery response shape:**
```json
{
  "studentId": "<string>",
  "gradeLevel": "<string>",
  "lastPredictionAt": "<ISO-8601 | null>",
  "masteryData": {
    "<standard_id>": {
      "mastery": 0-4,
      "source": "assessed | predicted | none",
      "confidence": "float | null",
      "assessedScore": "0-4 | null",
      "predictedScore": "0-4 | null",
      "lastAssessedDate": "<ISO-8601 | null>"
    }
  }
}
```

### 3.10 Authorization Matrix

| Resource | Admin | Teacher |
|----------|-------|---------|
| Schools | Full CRUD (own school) | No access |
| Teachers | Full management | No access |
| Students | Full CRUD | Read only (own class students) |
| Classes | Full CRUD + roster | Read only (own classes) |
| Assessments | Full access | CRUD on own classes only |
| Standards | Read | Read |
| Predictions | Full access | Own students only |
| /me | Yes | Yes |

School-scoping: All admin operations scoped to admin's `schoolId` from JWT.
Teacher ownership: Class access requires `teacherUserId` match. Student access requires enrollment in teacher's class.

---

## 4. CSV Import Specifications

### 4.1 Teachers CSV
| Column | Required | Validation |
|--------|----------|------------|
| email | Yes | Valid email, unique within school |
| first_name | Yes | 1-100 chars |
| last_name | Yes | 1-100 chars |
Max: 500 rows, 1MB.

### 4.2 Students CSV
| Column | Required | Validation |
|--------|----------|------------|
| first_name | Yes | 1-100 chars |
| last_name | Yes | 1-100 chars |
| grade_level | Yes | Integer 0-12 (0=K) |
| external_id | No | Up to 50 chars, unique if provided. Existing external_id → update, not duplicate. |
Max: 2000 rows, 2MB.

### 4.3 Classes CSV
| Column | Required | Validation |
|--------|----------|------------|
| name | Yes | 1-200 chars |
| term | Yes | 1-100 chars |
| grade_level | Yes | Integer 0-12 |
| teacher_email | Yes | Must match active teacher in school |
| student_external_ids | No | Semicolon-separated; unresolvable IDs reported as warnings |
Max: 500 rows, 1MB.

### 4.4 Assessments CSV
| Column | Required | Validation |
|--------|----------|------------|
| student_id | Yes | Valid externalId or studentId in school |
| date | Yes | YYYY-MM-DD, not in future |
| standard | Yes | Valid CCSS Math standard ID |
| score | Yes | Integer 0-4 |
Max: 10000 rows, 5MB. Upsert on student+date+standard match.

---

## 5. Frontend Architecture

### 5.1 Page & Route Structure

**Public**
| Route | Status |
|-------|--------|
| `/` | Exists — landing/redirect |
| `/login` | Exists — email + OAuth |
| `/signup` | Exists — keep for dev |
| `/confirm` | Exists — email confirmation |
| `/callback` | Exists — OAuth callback |
| `/forgot-password` | New |

**Teacher (authenticated)**
| Route | Status |
|-------|--------|
| `/classes` | Exists (placeholder) — needs real data |
| `/classes/[classId]` | New — core screen |
| `/settings` | New |

**Admin (authenticated)**
| Route | Status |
|-------|--------|
| `/admin` | New — dashboard |
| `/admin/school` | New — school settings/wizard |
| `/admin/teachers` | New — teacher management |
| `/admin/students` | New — student management |
| `/admin/classes` | New — class management |
| `/admin/classes/[classId]/roster` | New — roster management |

### 5.2 Navigation Design

**Teacher**: Top navbar only. Links: "My Classes". Profile dropdown (right). Breadcrumb in class view: "My Classes > [Class Name]".

**Admin**: Top navbar + persistent left sidebar (240px, collapsible to 64px icons). Sidebar items: Dashboard, School Settings, Teachers, Students, Classes. Active item highlighted.

### 5.3 Teacher Class View Layout

```
+------------------------------------------------------------------+
|  Navbar: [←] Class Name          [Add Assessment] [Predict] [👤] |
+----------+-------------------------------------------------------+
|          |                                                       |
|  Left    |                                                       |
|  Panel   |           D3.js Force Graph                           |
|  (320px) |           (fills remaining space)                     |
|          |                                                       |
| [Search] |                                                       |
| Student1 |                                          [Legend ▼]   |
| Student2*|                                                       |
| Student3 |                                                       |
|          |                                                       |
| ──────── |                                                       |
| Selected |                                                       |
| Student  |                                                       |
| Info     |                                                       |
+----------+-------------------------------------------------------+
```

- Left panel toggleable (slide animation, ~200ms)
- Force graph resizes dynamically when panel toggles
- No page-level scroll; graph fills viewport height minus navbar (64px)

### 5.4 Force Graph Design

**Rendering**: SVG via D3.js force simulation.
- Forces: forceLink (edges), forceManyBody (repulsion), forceCenter, forceCollide (prevent overlap)
- Nodes grouped/clustered by grade level

**Edges** by relationship type:
- Prerequisite: solid line + arrowhead
- Progression: dashed line + arrowhead
- Related: thin dotted line, no arrow

**Interactions**:
- Hover: tooltip (standard code, description, mastery, source, date)
- Click node: detail panel (description, assessment history, add assessment)
- Zoom/Pan: D3 zoom behavior, min 0.3x / max 5x, reset button
- Grade filter: dropdown for grade range
- Legend: bottom-right, collapsible

**No student selected**: All nodes gray, overlay prompt.
**After prediction**: Smooth color transitions (~500ms), loading overlay during prediction.

### 5.5 Shared Components

| Component | Description |
|-----------|-------------|
| Navbar | Teacher + admin variants, 64px, profile dropdown |
| Admin Sidebar | Collapsible, 240px/64px |
| Profile Dropdown | Name, role badge, settings, logout |
| Data Table | Sortable, searchable, paginated, row actions |
| Modal Dialog | Small/medium/large, form support |
| CSV Upload | Drag-drop, preview, validation, progress |
| Form Fields | Text, email, dropdown, combobox, multi-select, radio, date picker |
| Toast Notifications | Success/error/warning/info, auto-dismiss 5s |
| Confirmation Dialog | Destructive action warnings |
| Loading Skeleton | Shimmer placeholders for tables, cards, lists |
| Empty State | Icon + message + CTA button |
| Breadcrumb | Clickable path segments |
| Force Graph | React + D3 component (standards, relationships, mastery data props) |
| Mastery Badge | Colored circle/pill showing mastery level |

### 5.6 UX States

- **Loading**: Page-level spinner for initial load; skeleton placeholders for components; spinner on buttons during submission
- **Empty**: Contextual messages with CTAs (e.g., "No classes yet", "No assessments", "Select a student")
- **Error**: Inline error banners with retry; form validation errors below fields; CSV row-level errors in preview
- **Auth errors**: Session expiry toast → redirect to login; role mismatch → redirect to correct home page

---

## 6. ML Pipeline Design

### 6.1 Standards Data Model

Static JSON bundled at build time. Schema per standard:

```json
{
  "id": "CCSS.Math.Content.3.OA.A.1",
  "description": "Interpret products of whole numbers...",
  "gradeLevel": "3",
  "domain": "OA",
  "domainName": "Operations & Algebraic Thinking",
  "cluster": "A",
  "clusterDescription": "Represent and solve problems...",
  "sortOrder": 42,
  "relationships": [
    { "targetId": "2.OA.C.4", "type": "prerequisite", "strength": 0.9 },
    { "targetId": "3.OA.A.2", "type": "related", "strength": 0.8 },
    { "targetId": "4.OA.A.1", "type": "progression", "strength": 1.0 }
  ]
}
```

Top-level metadata: `version`, `source`, `lastUpdated`, `totalStandards`.

### 6.2 Feature Engineering

**Per-standard features** (5 per standard in deterministic sort order):
1. Latest score (float, -1 if never assessed)
2. Score count (integer)
3. Score trend (latest minus earliest, 0 if ≤1 assessment)
4. Days since last assessment (integer, -1 if never)
5. Mean score (float, -1 if never)

**Global features** (5, appended):
1. Grade level (integer, K=0)
2. Total assessments (integer)
3. Overall mean score (float)
4. Assessment span days (integer, first to last)
5. Standards assessed ratio (float)

**Vector length**: (standards_count × 5) + 5

Missing data encoded as sentinel values (-1), not NaN. XGBoost handles sentinels natively.

### 6.3 SageMaker Integration

- **Model**: XGBoost `multi:softprob` objective (5 classes: 0-4)
- **Endpoint**: `schoolsage-mastery-<stage>` (real-time inference)
- **Scaling**: 0-2 instances, scale to zero after 15min inactivity
- **Cold start**: Up to 5 minutes from zero

**Request format**:
```json
{
  "student_id": "<string>",
  "grade_level": "<string>",
  "features": [float, ...],
  "standard_ids": ["<string>", ...]
}
```

**Response format**:
```json
{
  "student_id": "<string>",
  "predictions": [
    {
      "standard_id": "<string>",
      "predicted_mastery": 0-4,
      "confidence": 0.0-1.0,
      "class_probabilities": [float, float, float, float, float]
    }
  ],
  "model_version": "<string>",
  "timestamp": "<ISO-8601>"
}
```

### 6.4 Prediction Flow

1. Teacher clicks "Run Prediction" for selected student
2. Frontend sends `POST /students/{studentId}/predictions`
3. Lambda creates Prediction record (`status: "pending"`)
4. Lambda queries all assessments for student (AP-14)
5. Lambda loads standards dataset (bundled JSON)
6. Lambda determines student grade level from student record
7. Lambda constructs feature vector (6.2)
8. Lambda invokes SageMaker endpoint (20s timeout)
9. On success: Lambda updates Prediction record with results (`status: "completed"`)
10. On failure: retry once after 2s; if still fails, set `status: "failed"`
11. Lambda returns prediction to frontend
12. Frontend re-fetches mastery endpoint and updates graph

**Timeouts**: 30s Lambda, 20s SageMaker invocation.
**Rate limiting**: 5 prediction requests per teacher per minute.

### 6.5 Error Handling

| Scenario | Behavior |
|----------|----------|
| Zero assessments | Return "insufficient data", skip SageMaker |
| Malformed CSV | Partial success: import valid rows, return errors |
| SageMaker unavailable | Retry once (2s delay), then `PREDICTION_UNAVAILABLE` |
| SageMaker cold start | Frontend shows "Model warming up..." |
| Lambda timeout | Return error, prediction status set to "failed" |

---

## 7. Infrastructure Changes

| Component | Change |
|-----------|--------|
| DynamoDB | Add GSI1, GSI2 to `SchoolSageAITable` |
| Cognito | Add custom attributes: `custom:role`, `custom:schoolId`. Disable self-signup before production. |
| API Gateway | Add all routes from Section 3 with Cognito authorizer |
| Lambda | Add handlers for each API resource + prediction Lambda |
| SageMaker | Deploy XGBoost endpoint (separate from CDK, or via CDK custom resource) |
| IAM | Prediction Lambda: `sagemaker:InvokeEndpoint` on endpoint ARN |
| S3 | Training data bucket (offline, not part of real-time flow) |

---

## 8. Cognito Configuration Changes

- Add custom attributes: `custom:role` (string: "admin"/"teacher"), `custom:schoolId` (string)
- Admin account creation: manual (AWS Console or seed script) with custom attributes set
- Teacher account creation: via `AdminCreateUser` API (sets custom attributes, sends invite or temp password)
- Disable self-signup before production launch (keep during dev)
- JWT ID token includes custom attributes for Lambda authorization
