using ResumeIQ.API.Models;

namespace ResumeIQ.API.BusinessLogic
{
    public interface IAIAnalysisRepository
    {
        Task<AIAnalysis?> GetLatestByJobApplicationIdAsync(string jobApplicationId);
        Task<AIAnalysis> AddAsync(AIAnalysis analysis);
    }
}
