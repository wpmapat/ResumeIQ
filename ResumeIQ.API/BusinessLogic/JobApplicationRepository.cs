using Microsoft.Azure.Cosmos;
using ResumeIQ.API.Models;

namespace ResumeIQ.API.BusinessLogic
{
    public class JobApplicationRepository : IJobApplicationRepository
    {
        private readonly Container _container;

        public JobApplicationRepository(CosmosClient cosmosClient, IConfiguration configuration)
        {
            var databaseName = configuration["CosmosDb:DatabaseName"]!;
            _container = cosmosClient.GetContainer(databaseName, "JobApplications");
        }

        public async Task<IEnumerable<JobApplication>> GetByUserIdAsync(string userId)
        {
            var query = new QueryDefinition("SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC")
                .WithParameter("@userId", userId);

            var results = new List<JobApplication>();

            using var iterator = _container.GetItemQueryIterator<JobApplication>(query,
                requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(userId) });

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            return results;
        }

        public async Task<JobApplication?> GetByIdAsync(string id, string userId)
        {
            try
            {
                var response = await _container.ReadItemAsync<JobApplication>(id, new PartitionKey(userId));
                return response.Resource;
            }
            catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }
        }

        public async Task<JobApplication> AddAsync(JobApplication jobApplication)
        {
            var response = await _container.CreateItemAsync(jobApplication, new PartitionKey(jobApplication.UserId));
            return response.Resource;
        }

        public async Task<JobApplication> UpdateAsync(JobApplication jobApplication)
        {
            var response = await _container.ReplaceItemAsync(jobApplication, jobApplication.Id, new PartitionKey(jobApplication.UserId));
            return response.Resource;
        }

        public async Task DeleteAsync(string id, string userId)
        {
            await _container.DeleteItemAsync<JobApplication>(id, new PartitionKey(userId));
        }
    }
}
