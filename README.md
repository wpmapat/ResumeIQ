# ResumeIQ

AI-powered resume analysis and cover letter generation for job seekers.

Upload your resume once, add a job description, and get a match score, missing keyword gaps, rewritten bullet points, and a tailored cover letter — all in under 30 seconds.

**Live app:** https://brave-stone-020404c1e.azurestaticapps.net

---

## Why I built this

AI-assisted job searching is becoming mainstream, but most tools treat it as a black box — paste your resume, get a vague score, move on. I wanted to build something production-grade that makes the AI reasoning transparent and actionable: not just *how well* your resume matches, but *what specifically* to change and why. It was also an opportunity to solve some genuinely interesting engineering problems end to end.

The interesting engineering problems were:

- **User data isolation enforced at the database layer** — every Cosmos DB query is scoped by the `oid` claim extracted from the JWT, using the user ID as the partition key. Even if the API layer had a bug, a cross-user read is physically impossible — Cosmos won't find the document in the wrong partition.
- **Credentialless cloud auth with Managed Identity** — Blob Storage access uses Azure Managed Identity with no connection strings in code or config. Download URLs are short-lived SAS tokens (15 min expiry) generated server-side using a delegated user key, so the client never holds a persistent credential.
- **Structured output from a generative model** — Claude returns freeform text, but the analysis endpoint needs a typed JSON object (match score, keyword list, rewritten bullets). The solution strips markdown code fences, deserialises with case-insensitive matching, and falls back gracefully — making the integration robust without over-engineering a retry loop.
- **Text extraction across formats** — resumes arrive as PDF or DOCX. Rather than a third-party conversion service, text is extracted in-process using PdfPig (PDF) and OpenXml (DOCX), keeping the pipeline simple and the extracted text immediately available for AI analysis without an async job.

---

## What it does

Most job seekers send the same resume to every application and get filtered out by ATS before a human ever reads it. ResumeIQ bridges the gap between finding a job and getting shortlisted:

- **Match score** — see how well your resume aligns with a job description (0–100)
- **Keyword gaps** — identify the skills and terms missing from your resume
- **Rewritten bullets** — get AI-suggested bullet points that mirror the job description language
- **Cover letter** — generate a tailored cover letter for each application in one click
- **Application tracker** — manage all your job applications in one place with status tracking

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Backend | ASP.NET Core 8 (.NET 10) |
| Database | Azure Cosmos DB (serverless) |
| File storage | Azure Blob Storage |
| AI | Claude API (claude-sonnet-4-6) |
| Auth | Azure Entra ID (MSAL, JWT bearer) |
| Hosting | Azure App Service (API) + Azure Static Web Apps (UI) |
| CI/CD | GitHub Actions |
| Monitoring | Azure Application Insights |
| Tests | xUnit + Moq (28 tests) |

---

## Architecture

```
Browser (React + MSAL)
        │
        │  JWT (Azure Entra ID)
        ▼
ASP.NET Core 8 API  ──►  Azure Cosmos DB
        │               (resumes, applications,
        │                analyses, cover letters)
        ├──────────────► Azure Blob Storage
        │               (resume files)
        │
        └──────────────► Claude API (Anthropic)
                        (analysis + cover letters)
```

Auth uses Azure Entra ID — the browser acquires a scoped JWT via MSAL and passes it as a Bearer token. Every database query is scoped by the user's `oid` claim so users can only ever see their own data. Blob Storage uses Managed Identity (no connection string). Download URLs are short-lived SAS tokens (15 min expiry).

---

## Project structure

```
ResumeIQ/
├── ResumeIQ.API/
│   ├── Controllers/          # ResumeController, JobApplicationController,
│   │                         # AIAnalysisController, CoverLetterController
│   ├── BusinessLogic/        # Services, repositories, interfaces
│   │   ├── AIService.cs      # Claude API integration
│   │   ├── ResumeParserService.cs  # PDF (PdfPig) + DOCX (OpenXml) text extraction
│   │   └── JsonHelper.cs     # Strips markdown code fences from Claude responses
│   └── Models/               # Resume, JobApplication, AIAnalysis, CoverLetter
├── ResumeIQ.UI/
│   └── src/
│       ├── pages/            # DashboardPage, ApplicationDetailPage, ResumePage, HelpPage
│       └── components/       # Navbar, shared UI components
├── ResumeIQ.Tests/           # xUnit unit tests (28 tests)
└── .github/workflows/        # CI/CD — API deploys to App Service, UI to Static Web Apps
```

---

## Running locally

### Prerequisites

- .NET 10 SDK
- Node.js 20+
- An Azure Entra ID app registration (or use the existing one if you have access)
- An Anthropic API key

### Backend

```bash
cd ResumeIQ.API
```

Create `appsettings.Development.json`:

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "<your-tenant-id>",
    "ClientId": "<your-client-id>",
    "Audience": "api://<your-client-id>"
  },
  "CosmosDb": {
    "AccountEndpoint": "<your-cosmos-endpoint>",
    "DatabaseName": "resumeiq"
  },
  "BlobStorage": {
    "ServiceUrl": "<your-blob-service-url>",
    "ContainerName": "resume-files"
  },
  "Anthropic": {
    "ApiKey": "<your-anthropic-api-key>"
  }
}
```

```bash
dotnet run
```

### Frontend

```bash
cd ResumeIQ.UI
npm install
npm run dev
```

The UI expects the API at `http://localhost:5241` by default (configurable in `src/authConfig.ts`).

### Tests

```bash
dotnet test ResumeIQ.Tests
```

---

## Data model

| Container | Partition key | Description |
|---|---|---|
| Resumes | `/userId` | Uploaded resume metadata + extracted text |
| JobApplications | `/userId` | Job applications with status tracking |
| AIAnalyses | `/jobApplicationId` | Match score, keywords, rewritten bullets |
| CoverLetters | `/jobApplicationId` | Generated cover letter content |

---

## Deployment

Both pipelines trigger on push to `main`:

- **API** → Azure App Service (`resumeiq-api`) via `.github/workflows/main_resumeiq-api.yml`
- **UI** → Azure Static Web Apps (`resumeiq-ui`) via `.github/workflows/azure-static-web-apps-brave-stone-020404c1e.yml`

Required App Service environment variables:

| Variable | Description |
|---|---|
| `CosmosDb__ConnectionString` | Cosmos DB connection string |
| `Anthropic__ApiKey` | Anthropic API key |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Application Insights connection string |
