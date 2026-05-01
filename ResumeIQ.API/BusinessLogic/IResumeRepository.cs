using ResumeIQ.API.Models;

namespace ResumeIQ.API.BusinessLogic
{
    public interface IResumeRepository
    {
        Task<Resume?> GetByUserIdAsync(string userId);
        Task<Resume> AddAsync(Resume resume);
        Task<Resume> UpdateAsync(Resume resume);
        Task DeleteAsync(string id, string userId);
    }
}
