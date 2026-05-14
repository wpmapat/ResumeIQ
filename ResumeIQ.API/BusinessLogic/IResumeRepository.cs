using ResumeIQ.API.Models;

namespace ResumeIQ.API.BusinessLogic
{
    public interface IResumeRepository
    {
        Task<IEnumerable<Resume>> GetAllByUserIdAsync(string userId);
        Task<Resume?> GetMostRecentByUserIdAsync(string userId);
        Task<Resume> AddAsync(Resume resume);
        Task SetPreferredAsync(string id, string userId);
        Task DeleteAsync(string id, string userId);
    }
}
