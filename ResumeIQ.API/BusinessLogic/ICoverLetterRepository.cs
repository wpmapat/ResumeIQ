using ResumeIQ.API.Models;

namespace ResumeIQ.API.BusinessLogic
{
    public interface ICoverLetterRepository
    {
        Task<CoverLetter?> GetLatestByJobApplicationIdAsync(string jobApplicationId);
        Task<CoverLetter> AddAsync(CoverLetter coverLetter);
    }
}
