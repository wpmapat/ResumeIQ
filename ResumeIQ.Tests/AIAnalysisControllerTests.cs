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
    public async Task Analyze_JobNotFound_ReturnsNotFound()
    {
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId)).ReturnsAsync((JobApplication?)null);

        var result = await BuildController(new(), jobAppRepo, new(), new()).Analyze("job-1");

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Analyze_NoResume_ReturnsBadRequest()
    {
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        var resumeRepo = new Mock<IResumeRepository>();

        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId))
            .ReturnsAsync(new JobApplication { Id = "job-1", UserId = UserId });
        resumeRepo.Setup(r => r.GetAllByUserIdAsync(UserId)).ReturnsAsync(Array.Empty<Resume>());

        var result = await BuildController(new(), jobAppRepo, resumeRepo, new()).Analyze("job-1");

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Analyze_ResumeWithNoExtractedText_ReturnsBadRequest()
    {
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        var resumeRepo = new Mock<IResumeRepository>();

        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId))
            .ReturnsAsync(new JobApplication { Id = "job-1", UserId = UserId });
        resumeRepo.Setup(r => r.GetAllByUserIdAsync(UserId))
            .ReturnsAsync(new[] { new Resume { Id = "res-1", ExtractedText = "" } });

        var result = await BuildController(new(), jobAppRepo, resumeRepo, new()).Analyze("job-1");

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Analyze_PreferredResume_UsesPreferredOverFirst()
    {
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        var resumeRepo = new Mock<IResumeRepository>();
        var aiService = new Mock<IAIService>();
        var analysisRepo = new Mock<IAIAnalysisRepository>();

        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId))
            .ReturnsAsync(new JobApplication { Id = "job-1", UserId = UserId, JobDescription = "jd" });
        resumeRepo.Setup(r => r.GetAllByUserIdAsync(UserId)).ReturnsAsync(new[]
        {
            new Resume { Id = "res-1", ExtractedText = "old text", IsPreferred = false },
            new Resume { Id = "res-2", ExtractedText = "preferred text", IsPreferred = true }
        });
        aiService.Setup(s => s.AnalyzeResumeAsync("preferred text", "jd"))
            .ReturnsAsync(new AIAnalysisResult { MatchScore = 90 });
        analysisRepo.Setup(r => r.AddAsync(It.IsAny<AIAnalysis>())).ReturnsAsync((AIAnalysis a) => a);

        await BuildController(analysisRepo, jobAppRepo, resumeRepo, aiService).Analyze("job-1");

        aiService.Verify(s => s.AnalyzeResumeAsync("preferred text", "jd"), Times.Once);
    }

    [Fact]
    public async Task Analyze_Success_ReturnsCreated()
    {
        var jobAppRepo = new Mock<IJobApplicationRepository>();
        var resumeRepo = new Mock<IResumeRepository>();
        var aiService = new Mock<IAIService>();
        var analysisRepo = new Mock<IAIAnalysisRepository>();

        jobAppRepo.Setup(r => r.GetByIdAsync("job-1", UserId))
            .ReturnsAsync(new JobApplication { Id = "job-1", UserId = UserId, JobDescription = "jd" });
        resumeRepo.Setup(r => r.GetAllByUserIdAsync(UserId))
            .ReturnsAsync(new[] { new Resume { Id = "res-1", ExtractedText = "my experience" } });
        aiService.Setup(s => s.AnalyzeResumeAsync("my experience", "jd"))
            .ReturnsAsync(new AIAnalysisResult { MatchScore = 80 });
        analysisRepo.Setup(r => r.AddAsync(It.IsAny<AIAnalysis>())).ReturnsAsync((AIAnalysis a) => a);

        var result = await BuildController(analysisRepo, jobAppRepo, resumeRepo, aiService).Analyze("job-1");

        Assert.IsType<CreatedAtActionResult>(result);
    }

    [Fact]
    public async Task GetLatest_Found_ReturnsOk()
    {
        var analysisRepo = new Mock<IAIAnalysisRepository>();
        var analysis = new AIAnalysis { Id = "a-1", JobApplicationId = "job-1", MatchScore = 75 };
        analysisRepo.Setup(r => r.GetLatestByJobApplicationIdAsync("job-1")).ReturnsAsync(analysis);

        var result = await BuildController(analysisRepo, new(), new(), new()).GetLatest("job-1");

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(analysis, ok.Value);
    }

    [Fact]
    public async Task GetLatest_NotFound_ReturnsNotFound()
    {
        var analysisRepo = new Mock<IAIAnalysisRepository>();
        analysisRepo.Setup(r => r.GetLatestByJobApplicationIdAsync("job-1")).ReturnsAsync((AIAnalysis?)null);

        var result = await BuildController(analysisRepo, new(), new(), new()).GetLatest("job-1");

        Assert.IsType<NotFoundResult>(result);
    }
}
