using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ResumeIQ.API.BusinessLogic
{
    public class AIService : IAIService
    {
        private readonly AnthropicClient _client;

        public AIService(IConfiguration configuration)
        {
            var apiKey = configuration["Anthropic:ApiKey"]!;
            _client = new AnthropicClient(apiKey);
        }

        public async Task<AIAnalysisResult> AnalyzeResumeAsync(string resumeText, string jobDescription)
        {
            var prompt = $$"""
                You are a resume analyst. Given a resume and a job description, analyze how well they match.

                Return ONLY valid JSON in this exact format, no extra text:
                {
                  "matchScore": <integer 0-100>,
                  "missingKeywords": ["keyword1", "keyword2"],
                  "rewrittenBullets": ["improved bullet 1", "improved bullet 2"]
                }

                Resume:
                {{resumeText}}

                Job Description:
                {{jobDescription}}
                """;

            var response = StripCodeFences(await SendMessageAsync(prompt));

            return JsonSerializer.Deserialize<AIAnalysisResult>(response, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new AIAnalysisResult();
        }

        public async Task<string> GenerateCoverLetterAsync(string resumeText, string jobDescription, string companyName, string roleTitle)
        {
            var prompt = $"""
                You are a professional cover letter writer. Write a concise, compelling cover letter for this job application.

                Role: {roleTitle} at {companyName}

                Resume:
                {resumeText}

                Job Description:
                {jobDescription}

                Write a professional cover letter (3-4 paragraphs). Start with "Dear Hiring Manager," and write only the letter body — no placeholders.
                """;

            return await SendMessageAsync(prompt);
        }

        private async Task<string> SendMessageAsync(string prompt)
        {
            var messages = new List<Message>
            {
                new Message(RoleType.User, prompt)
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                MaxTokens = 2048,
                Model = "claude-sonnet-4-6",
                Stream = false
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            return response.Message.ToString() ?? string.Empty;
        }

        private static string StripCodeFences(string text)
        {
            var trimmed = text.Trim();
            if (trimmed.StartsWith("```"))
            {
                var firstNewline = trimmed.IndexOf('\n');
                if (firstNewline >= 0) trimmed = trimmed[(firstNewline + 1)..];
                if (trimmed.EndsWith("```")) trimmed = trimmed[..^3].TrimEnd();
            }
            return trimmed;
        }
    }
}
