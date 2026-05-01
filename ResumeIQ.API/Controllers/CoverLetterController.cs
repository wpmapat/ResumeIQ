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

        public CoverLetterController(ICoverLetterRepository coverLetterRepository, IJobApplicationRepository jobApplicationRepository)
        {
            _coverLetterRepository = coverLetterRepository;
            _jobApplicationRepository = jobApplicationRepository;
        }

        private string GetUserId() =>
            User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
            ?? throw new UnauthorizedAccessException();

        [HttpGet]
        public async Task<IActionResult> GetLatest(string jobApplicationId)
        {
            var letter = await _coverLetterRepository.GetLatestByJobApplicationIdAsync(jobApplicationId);
            return letter == null ? NotFound() : Ok(letter);
        }

        [HttpPost]
        public async Task<IActionResult> Generate(string jobApplicationId)
        {
            var userId = GetUserId();
            var jobApp = await _jobApplicationRepository.GetByIdAsync(jobApplicationId, userId);
            if (jobApp == null) return NotFound("Job application not found.");

            // Claude API integration comes in Day 6
            var coverLetter = new CoverLetter
            {
                Id = Guid.NewGuid().ToString(),
                JobApplicationId = jobApplicationId,
                UserId = userId,
                Content = string.Empty,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _coverLetterRepository.AddAsync(coverLetter);
            return CreatedAtAction(nameof(GetLatest), new { jobApplicationId }, created);
        }
    }
}
