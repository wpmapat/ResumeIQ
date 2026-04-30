# ResumeIQ — Design Specification

---

## Product Goal

Job seekers spend hours tailoring their resume for each application — most don't do it at all and get filtered out by ATS (Applicant Tracking Systems) before a human ever reads their resume.

ResumeIQ solves this by:
- **Telling you exactly how well your resume matches a job** — with a score and specific gaps
- **Rewriting your bullet points** to match the job description language
- **Generating a cover letter** tailored to the role
- **Tracking all your applications** in one place so nothing falls through the cracks

**Target user:** Anyone actively job hunting who wants to maximize their chances of getting shortlisted without spending hours manually tailoring every application.

**Success metric:** User uploads resume once, adds a job description, and gets actionable AI suggestions in under 30 seconds.

**Differentiation:** LinkedIn solves job discovery. ResumeIQ solves the gap between finding a job and getting shortlisted. It tells you exactly why your resume may not get selected for a specific role and rewrites it to match.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Azure (Single Tenant)                                   │
│                                                          │
│   Browser (React + MSAL)                                 │
│       │  JWT Bearer Token (delegated user token)         │
│       ▼                                                  │
│   ASP.NET Core 8 API                                     │
│       │                                                  │
│       ├──► Azure Cosmos DB                               │
│       │        ├── Resumes                               │
│       │        ├── JobApplications                       │
│       │        ├── AIAnalyses                            │
│       │        └── CoverLetters                          │
│       │                                                  │
│       ├──► Azure Blob Storage                            │
│       │        └── resume-files/{userId}/{filename}      │
│       │                                                  │
│       └──► Claude API (Anthropic)                        │
│                └── Resume analysis + Cover letter        │
└─────────────────────────────────────────────────────────┘
```

**Data isolation:** Every query scoped by `oid` claim from JWT token. User A never sees User B's data.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React + TypeScript (Vite)                               │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │   │
│  │  │  Dashboard  │  │ App Detail   │  │  Resume Page   │  │   │
│  │  │    Page     │  │    Page      │  │                │  │   │
│  │  └─────────────┘  └──────────────┘  └────────────────┘  │   │
│  │                                                          │   │
│  │  MSAL — Azure AD authentication (JWT bearer token)       │   │
│  └──────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTPS + JWT
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ASP.NET Core 8 API (Azure App Service)                          │
│                                                                  │
│  ┌───────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Resume       │  │ JobApplication  │  │   AI             │  │
│  │  Controller   │  │   Controller    │  │   Controller     │  │
│  └───────┬───────┘  └────────┬────────┘  └────────┬─────────┘  │
│          │                   │                    │             │
│  ┌───────▼───────┐  ┌────────▼────────┐  ┌────────▼─────────┐  │
│  │  Resume       │  │ JobApplication  │  │   AI             │  │
│  │  BusinessLogic│  │  BusinessLogic  │  │   BusinessLogic  │  │
│  └───────┬───────┘  └────────┬────────┘  └────────┬─────────┘  │
│          │                   │                    │             │
│  ┌───────▼───────┐  ┌────────▼────────┐           │             │
│  │  Resume       │  │ JobApplication  │           │             │
│  │  Repository   │  │   Repository    │           │             │
│  └───────┬───────┘  └────────┬────────┘           │             │
└──────────┼───────────────────┼────────────────────┼─────────────┘
           │                   │                    │
     ┌─────▼──────┐     ┌──────▼──────┐     ┌──────▼──────────┐
     │   Azure    │     │   Azure     │     │   Claude API    │
     │    Blob    │     │  Cosmos DB  │     │  (Anthropic)    │
     │  Storage   │     │             │     │                 │
     │            │     │ - Resumes   │     │ - Analyze       │
     │ resume     │     │ - JobApps   │     │ - Cover Letter  │
     │ files      │     │ - Analyses  │     │                 │
     │            │     │ - CoverLtrs │     │                 │
     └────────────┘     └─────────────┘     └─────────────────┘
```

---

## How Components Talk to Each Other

**Browser → API**
- React makes HTTPS calls to the ASP.NET Core API
- Every request includes a JWT bearer token: `Authorization: Bearer <token>`
- Token obtained from Azure AD via MSAL when user signed in
- API validates the token on every request

**API → Cosmos DB**
- API uses the Cosmos DB .NET SDK to read/write data
- No connection string stored — uses Managed Identity
- Every query includes a `userId` filter so data is always scoped to the logged-in user

**API → Blob Storage**
- When user uploads a resume, API uses Azure Blob Storage SDK to store the file
- File path: `resume-files/{userId}/{filename}`
- Blob is private — not publicly accessible
- API saves the Blob URL in Cosmos DB for later retrieval

**API → Claude API**
- When user triggers analysis, API makes an HTTPS POST to Anthropic's API
- Sends a prompt containing resume text + job description
- Claude returns a response which the API parses into match score, keywords, and rewritten bullets
- Claude API key stored as environment variable — never in code

**Azure AD → Browser + API**
- Browser uses MSAL to get a token from Azure AD
- API uses Microsoft.Identity.Web to validate that token
- Both sides trust the same Azure AD app registration

```
Browser → (JWT) → API → Cosmos DB
                      → Blob Storage
                      → Claude API
         Azure AD issues and validates the JWT
```

---

## User Journey Flowchart

```
┌─────────────┐
│  Visit App  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐     Already signed in
│  Sign in with   │─────────────────────────┐
│   Microsoft     │                         │
└──────┬──────────┘                         │
       │ First time                         │
       ▼                                    ▼
┌─────────────────┐              ┌──────────────────┐
│ Upload Resume   │              │    Dashboard     │
│  (PDF/DOCX)     │─────────────►│ (Job App List)   │
└─────────────────┘              └────────┬─────────┘
                                          │
                    ┌─────────────────────┼──────────────────────┐
                    │                     │                      │
                    ▼                     ▼                      ▼
          ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
          │  Add New Job     │  │  Open Existing   │  │  Manage Resume   │
          │  Application     │  │  Application     │  │ (Replace/Delete) │
          └────────┬─────────┘  └────────┬─────────┘  └──────────────────┘
                   │                     │
                   ▼                     │
          ┌──────────────────┐           │
          │ Enter Company,   │           │
          │ Role, Job Desc,  │           │
          │ Date, Notes      │           │
          └────────┬─────────┘           │
                   │                     │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │  Application Detail  │
                   │  Status: Applied     │
                   └──────────┬───────────┘
                              │
               ┌──────────────┼──────────────┐
               │              │              │
               ▼              ▼              ▼
    ┌─────────────────┐  ┌──────────┐  ┌───────────────┐
    │ Analyze with AI │  │  Update  │  │    Generate   │
    └────────┬────────┘  │  Status  │  │ Cover Letter  │
             │           └──────────┘  └───────┬───────┘
             ▼                                 │
    ┌─────────────────┐               ┌────────▼───────┐
    │  Extract resume │               │ Send resume +  │
    │  text + job desc│               │ job desc to    │
    └────────┬────────┘               │  Claude API    │
             │                        └────────┬───────┘
             ▼                                 │
    ┌─────────────────┐               ┌────────▼───────┐
    │ Send to Claude  │               │ Display cover  │
    │      API        │               │    letter      │
    └────────┬────────┘               └────────────────┘
             │
             ▼
    ┌─────────────────┐
    │  Display:       │
    │  - Match Score  │
    │  - Missing Keys │
    │  - Rewritten    │
    │    Bullets      │
    └─────────────────┘
```

---

## Data Models

### User
| Field | Type | Notes |
|-------|------|-------|
| Id | string | Azure AD `oid` claim |
| Name | string | |
| Email | string | |

### Resume
| Field | Type | Notes |
|-------|------|-------|
| Id | string | |
| UserId | string | Partition key |
| FileName | string | Original file name |
| BlobUrl | string | Azure Blob Storage URL |
| ExtractedText | string | Parsed from PDF/DOCX |
| UploadedAt | DateTime | |

### JobApplication
| Field | Type | Notes |
|-------|------|-------|
| Id | string | |
| UserId | string | Partition key |
| CompanyName | string | |
| RoleTitle | string | |
| JobDescription | string | |
| Status | enum | Applied, Interview, Offer, Rejected |
| AppliedDate | DateTime | |
| Notes | string | |
| CreatedAt | DateTime | |

### AIAnalysis
| Field | Type | Notes |
|-------|------|-------|
| Id | string | |
| JobApplicationId | string | Partition key |
| UserId | string | |
| MatchScore | int | 0-100 |
| MissingKeywords | string[] | |
| RewrittenBullets | string[] | |
| CreatedAt | DateTime | |

### CoverLetter
| Field | Type | Notes |
|-------|------|-------|
| Id | string | |
| JobApplicationId | string | Partition key |
| UserId | string | |
| Content | string | |
| CreatedAt | DateTime | |

---

## API Endpoints

### Resume
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume` | Upload resume (PDF/DOCX) |
| GET | `/api/resume` | Get current user's resume |
| PUT | `/api/resume` | Replace resume with new file |
| DELETE | `/api/resume` | Delete resume |

### Job Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobapplication` | Add new job application |
| GET | `/api/jobapplication` | Get all applications for current user |
| GET | `/api/jobapplication/{id}` | Get single application |
| PUT | `/api/jobapplication/{id}` | Update status/notes |
| DELETE | `/api/jobapplication/{id}` | Delete application |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobapplication/{id}/analyze` | Run AI analysis |
| GET | `/api/jobapplication/{id}/analysis` | Get latest analysis |
| POST | `/api/jobapplication/{id}/coverletter` | Generate cover letter |
| GET | `/api/jobapplication/{id}/coverletter` | Get latest cover letter |

---

## Business Logic

### ResumeBusinessLogic
- `UploadResumeAsync(userId, file)` — extract text from PDF/DOCX, upload file to Blob Storage, save record to Cosmos DB. If resume already exists, replace it (delete old blob, update record)
- `GetResumeAsync(userId)` — get current user's resume
- `DeleteResumeAsync(userId)` — delete blob from storage + record from Cosmos DB

### JobApplicationBusinessLogic
- `CreateJobApplicationAsync(userId, application)` — validate required fields (company, role, job description), save to Cosmos DB
- `GetAllJobApplicationsAsync(userId)` — get all applications scoped by userId
- `GetJobApplicationByIdAsync(userId, id)` — get single application, verify it belongs to this user
- `UpdateJobApplicationAsync(userId, id, application)` — update status/notes, verify ownership
- `DeleteJobApplicationAsync(userId, id)` — delete application + all associated analyses and cover letters, verify ownership

### AIBusinessLogic
- `AnalyzeJobApplicationAsync(userId, jobApplicationId)` — fetch resume + job description, build prompt, call Claude API, parse response, save AIAnalysis record
- `GetLatestAnalysisAsync(userId, jobApplicationId)` — get most recent AIAnalysis for this job
- `GenerateCoverLetterAsync(userId, jobApplicationId)` — fetch resume + job description, build prompt, call Claude API, save CoverLetter record
- `GetLatestCoverLetterAsync(userId, jobApplicationId)` — get most recent cover letter for this job

---

## Cosmos DB Containers

| Container | Partition Key |
|-----------|--------------|
| Resumes | `/userId` |
| JobApplications | `/userId` |
| AIAnalyses | `/jobApplicationId` |
| CoverLetters | `/jobApplicationId` |

---

## UI Pages

| Page | Description |
|------|-------------|
| **Login** | Sign in with Microsoft button |
| **Dashboard** | List of all job applications, status badges, "Add Application" button |
| **Add/Edit Application** | Form — company, role, job description, applied date, notes |
| **Application Detail** | Job details, status, "Analyze with AI" button, AI results, "Generate Cover Letter" button, cover letter output |
| **Resume** | Current resume filename + upload date, upload/replace/delete buttons |

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Analyze triggered without resume uploaded | Show message: "Please upload your resume first" |
| Claude API unavailable | Show message: "AI analysis is temporarily unavailable. Please try again later." |
| Blob Storage upload fails | Show message: "Resume upload failed. Please try again." — do not save record |
| User tries to access another user's data | Return 403 Forbidden |
| Job description is empty | Validation error before saving |
| File format not PDF or DOCX | Show message: "Only PDF and DOCX files are supported" |
| File size too large | Reject files over 5MB — show clear message |

---

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR1 | User must sign in with Microsoft (Azure AD) to access the system |
| FR2 | Each user sees only their own data — no cross-user data access |
| FR3 | User session persists until they explicitly sign out |
| FR4 | User can upload a resume in PDF or DOCX format |
| FR5 | System extracts and stores text from the uploaded resume |
| FR6 | User can replace their resume with a new file at any time |
| FR7 | User can delete their resume |
| FR8 | Only one resume per user at a time |
| FR9 | User can add a job application with company name, role title, and job description |
| FR10 | User can view all their job applications in a list |
| FR11 | User can update the status of an application (Applied, Interview, Offer, Rejected) |
| FR12 | User can add/edit notes on any application |
| FR13 | User can delete a job application — deletes all associated analyses and cover letters |
| FR14 | User can trigger AI analysis on any job application manually |
| FR15 | AI analysis returns match score (0-100%), missing keywords, and rewritten bullet points |
| FR16 | User can re-run analysis at any time |
| FR17 | System saves every analysis run — most recent shown by default |
| FR18 | User can request a cover letter for any job application |
| FR19 | Cover letter is generated based on saved resume and job description |
| FR20 | User can re-generate cover letter at any time |
| FR21 | Most recent cover letter shown by default |

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR1 | All API endpoints require a valid Azure AD JWT token |
| NFR2 | Resume files stored in private Azure Blob Storage — not publicly accessible |
| NFR3 | Claude API key stored as environment variable / Azure Key Vault secret — never in code |
| NFR4 | All data transmission over HTTPS |
| NFR5 | Standard API responses (CRUD) return within 500ms |
| NFR6 | AI analysis completes within 30 seconds |
| NFR7 | Resume text extraction completes within 5 seconds |
| NFR8 | If Claude API is unavailable, return a clear error message — do not crash |
| NFR9 | If Blob Storage upload fails, do not save the Cosmos DB record — keep data consistent |
| NFR10 | Data model supports multiple users from day one — each query scoped by userId |
| NFR11 | Each user's data is isolated — adding more users requires no schema changes |
| NFR12 | Business logic separated from controllers — testable in isolation |
| NFR13 | Repository pattern used for all data access |
| NFR14 | Unit tests cover all business logic |
| NFR15 | Application Insights wired up from day one |
| NFR16 | Key business events logged — resume upload, job added, AI analysis triggered, cover letter generated |

---

## Out of Scope

- Auto-scraping job listings from LinkedIn/Indeed
- Auto-applying to jobs
- Multiple resumes per user
- Resume version history
- Sharing applications with other users
- Mobile app
- Email notifications
- Payment / subscription model

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | ASP.NET Core 8 Web API |
| Database | Azure Cosmos DB |
| File Storage | Azure Blob Storage |
| AI | Claude API (Anthropic) |
| Auth | Azure Entra ID (JWT bearer) |
| Frontend | React + TypeScript (Vite) |
| Hosting | Azure App Service + Static Web Apps |
| CI/CD | GitHub Actions |
| Monitoring | Application Insights |

---

## Project Structure

```
ResumeIQ/
├── ResumeIQ.API/           # ASP.NET Core 8 Web API
│   ├── Controllers/        # API endpoints
│   ├── BusinessLogic/      # Business logic + repository interfaces
│   └── Models/             # Data models
├── ResumeIQ.UI/            # React + TypeScript frontend
│   └── src/
│       └── pages/          # DashboardPage, ApplicationDetailPage, ResumePage
└── ResumeIQ.Tests/         # xUnit unit tests
```
