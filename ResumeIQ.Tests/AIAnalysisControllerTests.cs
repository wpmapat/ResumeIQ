using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using ResumeIQ.API.BusinessLogic;
using ResumeIQ.API.Controllers;
using ResumeIQ.API.Models;
using System.Security.Claims;

namespace ResumeIQ.Tests;

public class AIAnalysisControllerTests
{
    private const string UserId = "test-user-123";

    private static AIAnalysisController BuildController(
        Mock<IAIAnalysisRepository> analysisRepo,
        Mock<IJobApplicationRepository> jobAppRepo,
        Mock<IResumeRepository> resumeRepo,
        Mock<IAIService> aiService)
    {
        var controller = new AIAnalysisController(
            analysisRepo.Object,
            jobAppRepo.Object,
            resumeRepo.Object,
            aiService.Object,
            NullLogger<AIAnalysisController>.Instance);

        var user = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("http://schemas.microsoft.com/identity/claims/objectidentifier", UserId)
        ]));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        return controller;
    }

    [Fact]
    public async Task Analyze_NoResume_ReturnsBadRequest()
    {
        var analysisRepo = new Mock<IAIAnalysisRepository>();
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        var resumeRepo = new Mock<IResumeRepository>();
        var aiService = new Mock<IAIService>();

        var jobApp = new JobApplication { Id = "job-1", UserId = UserId, JobDescription = "some job" };
        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId)).ReturnsAsync(jobApp);
        resumeRepo.Setup(r => r.GetMostRecentByUserIdAsync(UserId)).ReturnsAsync((Resume?)null);

        var controller = BuildController(analysisRepo, jobAppRepo, resumeRepo, aiService);

        var result = await controller.Analyze("job-1");

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Analyze_ResumeWithNoExtractedText_ReturnsBadRequest()
    {
        var analysisRepo = new Mock<IAIAnalysisRepository>();
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        var resumeRepo = new Mock<IResumeRepository>();
        var aiService = new Mock<IAIService>();

        var jobApp = new JobApplication { Id = "job-1", UserId = UserId, JobDescription = "some job" };
        var resume = new Resume { Id = "res-1", UserId = UserId, ExtractedText = "" };
        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId)).ReturnsAsync(jobApp);
        resumeRepo.Setup(r => r.GetMostRecentByUserIdAsync(UserId)).ReturnsAsync(resume);

        var controller = BuildController(analysisRepo, jobAppRepo, resumeRepo, aiService);

        var result = await controller.Analyze("job-1");

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Analyze_JobNotFound_ReturnsNotFound()
    {
        var analysisRepo = new Mock<IAIAnalysisRepository>();
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        var resumeRepo = new Mock<IResumeRepository>();
        var aiService = new Mock<IAIService>();

        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId)).ReturnsAsync((JobApplication?)null);

        var controller = BuildController(analysisRepo, jobAppRepo, resumeRepo, aiService);

        var result = await controller.Analyze("job-1");

        Assert.IsType<NotFoundObjectResult>(result);
    }
}
