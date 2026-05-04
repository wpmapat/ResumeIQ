using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResumeIQ.API.BusinessLogic;
using ResumeIQ.API.Models;

namespace ResumeIQ.API.Controllers
{
    [ApiController]
    [Route("api/jobapplications/{jobApplicationId}/analysis")]
    [Authorize]
    public class AIAnalysisController : ControllerBase
    {
        private readonly IAIAnalysisRepository _analysisRepository;
        private readonly IJobApplicationRepository _jobApplicationRepository;
        private readonly IResumeRepository _resumeRepository;
        private readonly IAIService _aiService;

        public AIAnalysisController(
            IAIAnalysisRepository analysisRepository,
            IJobApplicationRepository jobApplicationRepository,
            IResumeRepository resumeRepository,
            IAIService aiService)
        {
            _analysisRepository = analysisRepository;
            _jobApplicationRepository = jobApplicationRepository;
            _resumeRepository = resumeRepository;
            _aiService = aiService;
        }

        private string GetUserId() =>
            User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
            ?? throw new UnauthorizedAccessException();

        [HttpGet]
        public async Task<IActionResult> GetLatest(string jobApplicationId)
        {
            var analysis = await _analysisRepository.GetLatestByJobApplicationIdAsync(jobApplicationId);
            return analysis == null ? NotFound() : Ok(analysis);
        }

        [HttpPost]
        public async Task<IActionResult> Analyze(string jobApplicationId)
        {
            var userId = GetUserId();

            var jobApp = await _jobApplicationRepository.GetByIdAsync(jobApplicationId, userId);
            if (jobApp == null) return NotFound("Job application not found.");

            var resume = await _resumeRepository.GetByUserIdAsync(userId);
            if (resume == null) return BadRequest("No resume found. Please upload a resume first.");
            if (string.IsNullOrEmpty(resume.ExtractedText)) return BadRequest("Resume text not yet extracted.");

            var result = await _aiService.AnalyzeResumeAsync(resume.ExtractedText, jobApp.JobDescription);

            var analysis = new AIAnalysis
            {
                Id = Guid.NewGuid().ToString(),
                JobApplicationId = jobApplicationId,
                UserId = userId,
                MatchScore = result.MatchScore,
                MissingKeywords = result.MissingKeywords,
                RewrittenBullets = result.RewrittenBullets,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _analysisRepository.AddAsync(analysis);
            return CreatedAtAction(nameof(GetLatest), new { jobApplicationId }, created);
        }
    }
}
