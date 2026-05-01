using Microsoft.Azure.Cosmos;
using ResumeIQ.API.Models;

namespace ResumeIQ.API.BusinessLogic
{
    public class ResumeRepository : IResumeRepository
    {
        private readonly Container _container;

        public ResumeRepository(CosmosClient cosmosClient, IConfiguration configuration)
        {
            var databaseName = configuration["CosmosDb:DatabaseName"]!;
            _container = cosmosClient.GetContainer(databaseName, "Resumes");
        }

        public async Task<Resume?> GetByUserIdAsync(string userId)
        {
            var query = new QueryDefinition("SELECT * FROM c WHERE c.userId = @userId")
                .WithParameter("@userId", userId);

            using var iterator = _container.GetItemQueryIterator<Resume>(query,
                requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(userId) });

            if (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                return response.FirstOrDefault();
            }

            return null;
        }

        public async Task<Resume> AddAsync(Resume resume)
        {
            var response = await _container.CreateItemAsync(resume, new PartitionKey(resume.UserId));
            return response.Resource;
        }

        public async Task<Resume> UpdateAsync(Resume resume)
        {
            var response = await _container.ReplaceItemAsync(resume, resume.Id, new PartitionKey(resume.UserId));
            return response.Resource;
        }

        public async Task DeleteAsync(string id, string userId)
        {
            await _container.DeleteItemAsync<Resume>(id, new PartitionKey(userId));
        }
    }
}
