namespace ResumeIQ.API.BusinessLogic
{
    public class AIAnalysisResult
    {
        public int MatchScore { get; set; }
        public List<string> MissingKeywords { get; set; } = new();
        public List<string> RewrittenBullets { get; set; } = new();
    }

    public interface IAIService
    {
        Task<AIAnalysisResult> AnalyzeResumeAsync(string resumeText, string jobDescription);
        Task<string> GenerateCoverLetterAsync(string resumeText, string jobDescription, string companyName, string roleTitle);
    }
}
