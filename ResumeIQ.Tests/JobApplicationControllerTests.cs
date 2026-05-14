using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using ResumeIQ.API.BusinessLogic;
using ResumeIQ.API.Controllers;
using ResumeIQ.API.Models;
using System.Security.Claims;

namespace ResumeIQ.Tests;

public class JobApplicationControllerTests
{
    private const string UserId = "test-user-123";

    private static JobApplicationController BuildController(Mock<IJobApplicationRepository> repo)
    {
        var controller = new JobApplicationController(repo.Object, NullLogger<JobApplicationController>.Instance);

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
    public async Task GetById_NotFound_ReturnsNotFound()
    {
        var repo = new Mock<IJobApplicationRepository>();
        repo.Setup(r => r.GetByIdAsync("missing", UserId)).ReturnsAsync((JobApplication?)null);

        var controller = BuildController(repo);
        var result = await controller.GetById("missing");

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetById_Exists_ReturnsOk()
    {
        var repo = new Mock<IJobApplicationRepository>();
        var app = new JobApplication { Id = "job-1", UserId = UserId, CompanyName = "Acme" };
        repo.Setup(r => r.GetByIdAsync("job-1", UserId)).ReturnsAsync(app);

        var controller = BuildController(repo);
        var result = await controller.GetById("job-1");

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(app, ok.Value);
    }

    [Fact]
    public async Task Delete_NotFound_ReturnsNotFound()
    {
        var repo = new Mock<IJobApplicationRepository>();
        repo.Setup(r => r.GetByIdAsync("missing", UserId)).ReturnsAsync((JobApplication?)null);

        var controller = BuildController(repo);
        var result = await controller.Delete("missing");

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_SetsUserIdAndCreatedAt()
    {
        var repo = new Mock<IJobApplicationRepository>();
        repo.Setup(r => r.AddAsync(It.IsAny<JobApplication>()))
            .ReturnsAsync((JobApplication a) => a);

        var controller = BuildController(repo);
        var input = new JobApplication { CompanyName = "Acme", RoleTitle = "Dev" };

        await controller.Create(input);

        Assert.Equal(UserId, input.UserId);
        Assert.NotEqual(default, input.CreatedAt);
    }
}
