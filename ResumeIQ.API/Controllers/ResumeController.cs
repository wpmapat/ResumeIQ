using Azure.Storage.Blobs;
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
        private readonly ILogger<ResumeController> _logger;

        public ResumeController(
            IResumeRepository resumeRepository,
            IResumeParserService resumeParserService,
            BlobServiceClient blobServiceClient,
            IConfiguration configuration,
            ILogger<ResumeController> logger)
        {
            _resumeRepository = resumeRepository;
            _resumeParserService = resumeParserService;
            _blobServiceClient = blobServiceClient;
            _configuration = configuration;
            _logger = logger;
        }

        private string GetUserId() =>
            User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
            ?? throw new UnauthorizedAccessException();

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _resumeRepository.GetAllByUserIdAsync(GetUserId()));

        [HttpGet("{id}/download")]
        public async Task<IActionResult> GetDownloadUrl(string id)
        {
            var resumes = await _resumeRepository.GetAllByUserIdAsync(GetUserId());
            var resume = resumes.FirstOrDefault(r => r.Id == id);
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
            return Ok(new { url = $"{resume.BlobUrl}?{sasParams}", fileName = resume.FileName });
        }

        [HttpPost]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No file provided.");

            var extension = Path.GetExtension(file.FileName).ToLower();
            if (extension != ".pdf" && extension != ".docx")
                return BadRequest("Only PDF and DOCX files are supported.");

            var userId = GetUserId();

            string extractedText;
            using (var parseStream = file.OpenReadStream())
            {
                extractedText = _resumeParserService.ExtractText(parseStream, extension);
            }

            var containerName = _configuration["BlobStorage:ContainerName"]!;
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobName = $"{userId}/{Guid.NewGuid()}{extension}";
            var blobClient = containerClient.GetBlobClient(blobName);

            using (var uploadStream = file.OpenReadStream())
            {
                await blobClient.UploadAsync(uploadStream, overwrite: true);
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

            try
            {
                var created = await _resumeRepository.AddAsync(resume);
                _logger.LogInformation("Resume uploaded: {Id} for user {UserId}, file {FileName}", created.Id, created.UserId, created.FileName);
                return Ok(created);
            }
            catch
            {
                _logger.LogError("Cosmos save failed after blob upload for user {UserId}, deleting blob {BlobName}", userId, blobName);
                await blobClient.DeleteIfExistsAsync();
                throw;
            }
        }

        [HttpPut("{id}/preferred")]
        public async Task<IActionResult> SetPreferred(string id)
        {
            var userId = GetUserId();
            var resumes = await _resumeRepository.GetAllByUserIdAsync(userId);
            if (!resumes.Any(r => r.Id == id)) return NotFound();
            await _resumeRepository.SetPreferredAsync(id, userId);
            _logger.LogInformation("Resume {Id} set as preferred for user {UserId}", id, userId);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var userId = GetUserId();
            await _resumeRepository.DeleteAsync(id, userId);
            _logger.LogInformation("Resume deleted: {Id} for user {UserId}", id, userId);
            return NoContent();
        }
    }
}
