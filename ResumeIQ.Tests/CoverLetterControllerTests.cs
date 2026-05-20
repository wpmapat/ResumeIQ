using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using ResumeIQ.API.BusinessLogic;
using ResumeIQ.API.Controllers;
using ResumeIQ.API.Models;
using System.Security.Claims;

namespace ResumeIQ.Tests;

public class CoverLetterControllerTests
{
    private const string UserId = "test-user-123";

    private static CoverLetterController BuildController(
        Mock<ICoverLetterRepository> coverLetterRepo,
        Mock<IJobApplicationRepository> jobAppRepo,
        Mock<IResumeRepository> resumeRepo,
        Mock<IAIService> aiService)
    {
        var controller = new CoverLetterController(
            coverLetterRepo.Object,
            jobAppRepo.Object,
            resumeRepo.Object,
            aiService.Object,
            NullLogger<CoverLetterController>.Instance);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim("http://schemas.microsoft.com/identity/claims/objectidentifier", UserId)
                ]))
            }
        };

        return controller;
    }

    [Fact]
    public async Task GetLatest_JobNotFound_ReturnsNotFound()
    {
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId)).ReturnsAsync((JobApplication?)null);

        var result = await BuildController(new(), jobAppRepo, new(), new()).GetLatest("job-1");

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetLatest_NoLetter_ReturnsNotFound()
    {
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        var coverLetterRepo = new Mock<ICoverLetterRepository>();

        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId))
            .ReturnsAsync(new JobApplication { Id = "job-1", UserId = UserId });
        coverLetterRepo.Setup(r => r.GetLatestByJobApplicationIdAsync("job-1"))
            .ReturnsAsync((CoverLetter?)null);

        var result = await BuildController(coverLetterRepo, jobAppRepo, new(), new()).GetLatest("job-1");

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetLatest_Found_ReturnsOk()
    {
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        var coverLetterRepo = new Mock<ICoverLetterRepository>();
        var letter = new CoverLetter { Id = "cl-1", JobApplicationId = "job-1", Content = "Dear Hiring Manager..." };

        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId))
            .ReturnsAsync(new JobApplication { Id = "job-1", UserId = UserId });
        coverLetterRepo.Setup(r => r.GetLatestByJobApplicationIdAsync("job-1")).ReturnsAsync(letter);

        var result = await BuildController(coverLetterRepo, jobAppRepo, new(), new()).GetLatest("job-1");

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(letter, ok.Value);
    }

    [Fact]
    public async Task Generate_JobNotFound_ReturnsNotFound()
    {
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId)).ReturnsAsync((JobApplication?)null);

        var result = await BuildController(new(), jobAppRepo, new(), new()).Generate("job-1");

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Generate_NoResume_ReturnsBadRequest()
    {
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        var resumeRepo = new Mock<IResumeRepository>();

        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId))
            .ReturnsAsync(new JobApplication { Id = "job-1", UserId = UserId });
        resumeRepo.Setup(r => r.GetAllByUserIdAsync(UserId)).ReturnsAsync(Array.Empty<Resume>());

        var result = await BuildController(new(), jobAppRepo, resumeRepo, new()).Generate("job-1");

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Generate_ResumeWithNoExtractedText_ReturnsBadRequest()
    {
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        var resumeRepo = new Mock<IResumeRepository>();

        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId))
            .ReturnsAsync(new JobApplication { Id = "job-1", UserId = UserId });
        resumeRepo.Setup(r => r.GetAllByUserIdAsync(UserId))
            .ReturnsAsync(new[] { new Resume { Id = "res-1", ExtractedText = "" } });

        var result = await BuildController(new(), jobAppRepo, resumeRepo, new()).Generate("job-1");

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Generate_Success_ReturnsCreated()
    {
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        var resumeRepo = new Mock<IResumeRepository>();
        var aiService = new Mock<IAIService>();
        var coverLetterRepo = new Mock<ICoverLetterRepository>();

        var jobApp = new JobApplication { Id = "job-1", UserId = UserId, JobDescription = "jd", CompanyName = "Acme", RoleTitle = "Dev" };
        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId)).ReturnsAsync(jobApp);
        resumeRepo.Setup(r => r.GetAllByUserIdAsync(UserId))
            .ReturnsAsync(new[] { new Resume { Id = "res-1", ExtractedText = "my experience" } });
        aiService.Setup(s => s.GenerateCoverLetterAsync("my experience", "jd", "Acme", "Dev"))
            .ReturnsAsync("Dear Hiring Manager...");
        coverLetterRepo.Setup(r => r.AddAsync(It.IsAny<CoverLetter>())).ReturnsAsync((CoverLetter c) => c);

        var result = await BuildController(coverLetterRepo, jobAppRepo, resumeRepo, aiService).Generate("job-1");

        Assert.IsType<CreatedAtActionResult>(result);
    }
}
