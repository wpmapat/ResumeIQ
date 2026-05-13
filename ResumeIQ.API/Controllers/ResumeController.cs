using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
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
        private readonly IResumeParserService _resumeParserService;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly IConfiguration _configuration;

        public ResumeController(
            IResumeRepository resumeRepository,
            IResumeParserService resumeParserService,
            BlobServiceClient blobServiceClient,
            IConfiguration configuration)
        {
            _resumeRepository = resumeRepository;
            _resumeParserService = resumeParserService;
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

            var extension = Path.GetExtension(file.FileName).ToLower();
            if (extension != ".pdf" && extension != ".docx")
                return BadRequest("Only PDF and DOCX files are supported.");

            var userId = GetUserId();

            // Extract text from file before uploading
            string extractedText;
            using (var parseStream = file.OpenReadStream())
            {
                extractedText = _resumeParserService.ExtractText(parseStream, extension);
            }

            // Upload to Blob Storage
            var containerName = _configuration["BlobStorage:ContainerName"]!;
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobName = $"{userId}/{Guid.NewGuid()}{extension}";
            var blobClient = containerClient.GetBlobClient(blobName);

            using (var uploadStream = file.OpenReadStream())
            {
                await blobClient.UploadAsync(uploadStream, overwrite: true);
            }

            // Save or update resume record in Cosmos DB
            var existing = await _resumeRepository.GetByUserIdAsync(userId);
            if (existing != null)
            {
                existing.FileName = file.FileName;
                existing.BlobUrl = blobClient.Uri.ToString();
                existing.ExtractedText = extractedText;
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
                ExtractedText = extractedText,
                UploadedAt = DateTime.UtcNow
            };
            var created = await _resumeRepository.AddAsync(resume);
            return CreatedAtAction(nameof(Get), created);
        }

        [HttpGet("download")]
        public async Task<IActionResult> GetDownloadUrl()
        {
            var resume = await _resumeRepository.GetByUserIdAsync(GetUserId());
            if (resume == null) return NotFound();

            var blobUri = new Uri(resume.BlobUrl);
            var uriBuilder = new BlobUriBuilder(blobUri);

            var expiresOn = DateTimeOffset.UtcNow.AddMinutes(15);
            var userDelegationKey = await _blobServiceClient.GetUserDelegationKeyAsync(DateTimeOffset.UtcNow, expiresOn);

            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = uriBuilder.BlobContainerName,
                BlobName = uriBuilder.BlobName,
                Resource = "b",
                ExpiresOn = expiresOn,
            };
            sasBuilder.SetPermissions(BlobSasPermissions.Read);

            var sasParams = sasBuilder.ToSasQueryParameters(userDelegationKey, uriBuilder.AccountName);
            var downloadUrl = $"{resume.BlobUrl}?{sasParams}";

            return Ok(new { url = downloadUrl, fileName = resume.FileName });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            await _resumeRepository.DeleteAsync(id, GetUserId());
            return NoContent();
        }
    }
}
