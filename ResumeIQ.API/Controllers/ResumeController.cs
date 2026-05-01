using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResumeIQ.API.BusinessLogic;
using ResumeIQ.API.Models;

namespace ResumeIQ.API.Controllers
{
    [ApiController]
    [Route("api/resume")]
    [Authorize]
    public class ResumeController : ControllerBase
    {
        private readonly IResumeRepository _resumeRepository;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly IConfiguration _configuration;

        public ResumeController(IResumeRepository resumeRepository, BlobServiceClient blobServiceClient, IConfiguration configuration)
        {
            _resumeRepository = resumeRepository;
            _blobServiceClient = blobServiceClient;
            _configuration = configuration;
        }

        private string GetUserId() =>
            User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
            ?? throw new UnauthorizedAccessException();

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var resume = await _resumeRepository.GetByUserIdAsync(GetUserId());
            if (resume == null) return NotFound();
            return Ok(resume);
        }

        [HttpPost]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No file provided.");

            var userId = GetUserId();
            var containerName = _configuration["BlobStorage:ContainerName"]!;
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobName = $"{userId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var blobClient = containerClient.GetBlobClient(blobName);

            using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, overwrite: true);

            var existing = await _resumeRepository.GetByUserIdAsync(userId);
            if (existing != null)
            {
                existing.FileName = file.FileName;
                existing.BlobUrl = blobClient.Uri.ToString();
                existing.UploadedAt = DateTime.UtcNow;
                var updated = await _resumeRepository.UpdateAsync(existing);
                return Ok(updated);
            }

            var resume = new Resume
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                FileName = file.FileName,
                BlobUrl = blobClient.Uri.ToString(),
                UploadedAt = DateTime.UtcNow
            };
            var created = await _resumeRepository.AddAsync(resume);
            return CreatedAtAction(nameof(Get), created);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            await _resumeRepository.DeleteAsync(id, GetUserId());
            return NoContent();
        }
    }
}
