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

        public AIAnalysisController(IAIAnalysisRepository analysisRepository, IJobApplicationRepository jobApplicationRepository)
        {
            _analysisRepository = analysisRepository;
            _jobApplicationRepository = jobApplicationRepository;
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

            // Claude API integration comes in Day 6
            var analysis = new AIAnalysis
            {
                Id = Guid.NewGuid().ToString(),
                JobApplicationId = jobApplicationId,
                UserId = userId,
                MatchScore = 0,
                MissingKeywords = new List<string>(),
                RewrittenBullets = new List<string>(),
                CreatedAt = DateTime.UtcNow
            };

            var created = await _analysisRepository.AddAsync(analysis);
            return CreatedAtAction(nameof(GetLatest), new { jobApplicationId }, created);
        }
    }
}
