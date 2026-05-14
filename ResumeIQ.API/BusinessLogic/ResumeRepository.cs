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

        public async Task<IEnumerable<Resume>> GetAllByUserIdAsync(string userId)
        {
            var query = new QueryDefinition("SELECT * FROM c WHERE c.userId = @userId ORDER BY c.uploadedAt DESC")
                .WithParameter("@userId", userId);

            var results = new List<Resume>();
            using var iterator = _container.GetItemQueryIterator<Resume>(query,
                requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(userId) });

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            return results;
        }

        public async Task<Resume?> GetMostRecentByUserIdAsync(string userId)
        {
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.uploadedAt DESC OFFSET 0 LIMIT 1")
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

        public async Task SetPreferredAsync(string id, string userId)
        {
            var all = (await GetAllByUserIdAsync(userId)).ToList();
            foreach (var resume in all)
            {
                resume.IsPreferred = resume.Id == id;
                await _container.UpsertItemAsync(resume, new PartitionKey(userId));
            }
        }

        public async Task DeleteAsync(string id, string userId)
        {
            await _container.DeleteItemAsync<Resume>(id, new PartitionKey(userId));
        }
    }
}
