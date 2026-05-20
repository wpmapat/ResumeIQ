using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResumeIQ.API.BusinessLogic;
using ResumeIQ.API.Models;

namespace ResumeIQ.API.Controllers
{
    [ApiController]
    [Route("api/jobapplications")]
    [Authorize]
    public class JobApplicationController : ControllerBase
    {
        private readonly IJobApplicationRepository _repository;
        private readonly ILogger<JobApplicationController> _logger;

        public JobApplicationController(IJobApplicationRepository repository, ILogger<JobApplicationController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        private string GetUserId() =>
            User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
            ?? throw new UnauthorizedAccessException();

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _repository.GetByUserIdAsync(GetUserId()));

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var app = await _repository.GetByIdAsync(id, GetUserId());
            return app == null ? NotFound() : Ok(app);
        }

        [HttpPost]
        public async Task<IActionResult> Create(JobApplication jobApplication)
        {
            jobApplication.Id = Guid.NewGuid().ToString();
            jobApplication.UserId = GetUserId();
            jobApplication.CreatedAt = DateTime.UtcNow;
            var created = await _repository.AddAsync(jobApplication);
            _logger.LogInformation("Job application created: {Id} for user {UserId}", created.Id, created.UserId);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, JobApplication jobApplication)
        {
            var existing = await _repository.GetByIdAsync(id, GetUserId());
            if (existing == null) return NotFound();

            existing.CompanyName = jobApplication.CompanyName;
            existing.RoleTitle = jobApplication.RoleTitle;
            existing.JobDescription = jobApplication.JobDescription;
            existing.Status = jobApplication.Status;
            existing.AppliedDate = jobApplication.AppliedDate;
            existing.Notes = jobApplication.Notes;

            var updated = await _repository.UpdateAsync(existing);
            _logger.LogInformation("Job application updated: {Id} for user {UserId}", updated.Id, updated.UserId);
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var existing = await _repository.GetByIdAsync(id, GetUserId());
            if (existing == null) return NotFound();
            await _repository.DeleteAsync(id, GetUserId());
            _logger.LogInformation("Job application deleted: {Id} for user {UserId}", id, GetUserId());
            return NoContent();
        }
    }
}
