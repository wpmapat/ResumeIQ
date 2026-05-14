using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResumeIQ.API.BusinessLogic;
using ResumeIQ.API.Models;

namespace ResumeIQ.API.Controllers
{
    [ApiController]
    [Route("api/jobapplications/{jobApplicationId}/coverletter")]
    [Authorize]
    public class CoverLetterController : ControllerBase
    {
        private readonly ICoverLetterRepository _coverLetterRepository;
        private readonly IJobApplicationRepository _jobApplicationRepository;
        private readonly IResumeRepository _resumeRepository;
        private readonly IAIService _aiService;
        private readonly ILogger<CoverLetterController> _logger;

        public CoverLetterController(
            ICoverLetterRepository coverLetterRepository,
            IJobApplicationRepository jobApplicationRepository,
            IResumeRepository resumeRepository,
            IAIService aiService,
            ILogger<CoverLetterController> logger)
        {
            _coverLetterRepository = coverLetterRepository;
            _jobApplicationRepository = jobApplicationRepository;
            _resumeRepository = resumeRepository;
            _aiService = aiService;
            _logger = logger;
        }

        private string GetUserId() =>
            User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
            ?? throw new UnauthorizedAccessException();

        [HttpGet]
        public async Task<IActionResult> GetLatest(string jobApplicationId)
        {
            var userId = GetUserId();
            var jobApp = await _jobApplicationRepository.GetByIdAsync(jobApplicationId, userId);
            if (jobApp == null) return NotFound();
            var letter = await _coverLetterRepository.GetLatestByJobApplicationIdAsync(jobApplicationId);
            return letter == null ? NotFound() : Ok(letter);
        }

        [HttpPost]
        public async Task<IActionResult> Generate(string jobApplicationId)
        {
            var userId = GetUserId();

            var jobApp = await _jobApplicationRepository.GetByIdAsync(jobApplicationId, userId);
            if (jobApp == null) return NotFound("Job application not found.");

            var resume = await _resumeRepository.GetMostRecentByUserIdAsync(userId);
            if (resume == null) return BadRequest("No resume found. Please upload a resume first.");
            if (string.IsNullOrEmpty(resume.ExtractedText)) return BadRequest("Resume text not yet extracted.");

            var content = await _aiService.GenerateCoverLetterAsync(
                resume.ExtractedText,
                jobApp.JobDescription,
                jobApp.CompanyName,
                jobApp.RoleTitle);

            var coverLetter = new CoverLetter
            {
                Id = Guid.NewGuid().ToString(),
                JobApplicationId = jobApplicationId,
                UserId = userId,
                Content = content,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _coverLetterRepository.AddAsync(coverLetter);
            _logger.LogInformation("Cover letter generated for job application {JobApplicationId} by user {UserId}", jobApplicationId, userId);
            return CreatedAtAction(nameof(GetLatest), new { jobApplicationId }, created);
        }
    }
}
