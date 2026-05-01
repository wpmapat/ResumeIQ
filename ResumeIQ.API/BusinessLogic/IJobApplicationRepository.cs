using ResumeIQ.API.Models;

namespace ResumeIQ.API.BusinessLogic
{
    public interface IJobApplicationRepository
    {
        Task<IEnumerable<JobApplication>> GetByUserIdAsync(string userId);
        Task<JobApplication?> GetByIdAsync(string id, string userId);
        Task<JobApplication> AddAsync(JobApplication jobApplication);
        Task<JobApplication> UpdateAsync(JobApplication jobApplication);
        Task DeleteAsync(string id, string userId);
    }
}
