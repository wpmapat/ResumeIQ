using Azure.Identity;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Azure.Cosmos;
using Microsoft.Identity.Web;
using ResumeIQ.API.BusinessLogic;

var builder = WebApplication.CreateBuilder(args);

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

builder.Services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
{
    options.TokenValidationParameters.ValidateIssuer = false;
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173"
        )
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

// Controllers
builder.Services.AddControllers();

// Cosmos DB
var cosmosDatabaseName = builder.Configuration["CosmosDb:DatabaseName"]!;
var cosmosConnectionString = builder.Configuration["CosmosDb:ConnectionString"];
var cosmosClient = !string.IsNullOrEmpty(cosmosConnectionString)
    ? new CosmosClient(cosmosConnectionString)
    : new CosmosClient(builder.Configuration["CosmosDb:AccountEndpoint"]!, new DefaultAzureCredential());
builder.Services.AddSingleton(cosmosClient);

// AI Service
builder.Services.AddScoped<IAIService, AIService>();
builder.Services.AddScoped<IResumeParserService, ResumeParserService>();

// Repositories
builder.Services.AddScoped<IResumeRepository, ResumeRepository>();
builder.Services.AddScoped<IJobApplicationRepository, JobApplicationRepository>();
builder.Services.AddScoped<IAIAnalysisRepository, AIAnalysisRepository>();
builder.Services.AddScoped<ICoverLetterRepository, CoverLetterRepository>();

// Blob Storage
var blobServiceUrl = builder.Configuration["BlobStorage:ServiceUrl"]!;
var blobServiceClient = new BlobServiceClient(new Uri(blobServiceUrl), new DefaultAzureCredential());
builder.Services.AddSingleton(blobServiceClient);

var app = builder.Build();

app.UseCors();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
