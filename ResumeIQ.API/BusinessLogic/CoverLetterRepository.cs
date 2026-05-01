using Microsoft.Azure.Cosmos;
using ResumeIQ.API.Models;

namespace ResumeIQ.API.BusinessLogic
{
    public class CoverLetterRepository : ICoverLetterRepository
    {
        private readonly Container _container;

        public CoverLetterRepository(CosmosClient cosmosClient, IConfiguration configuration)
        {
            var databaseName = configuration["CosmosDb:DatabaseName"]!;
            _container = cosmosClient.GetContainer(databaseName, "CoverLetters");
        }

        public async Task<CoverLetter?> GetLatestByJobApplicationIdAsync(string jobApplicationId)
        {
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.jobApplicationId = @jobApplicationId ORDER BY c.createdAt DESC OFFSET 0 LIMIT 1")
                .WithParameter("@jobApplicationId", jobApplicationId);

            using var iterator = _container.GetItemQueryIterator<CoverLetter>(query,
                requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(jobApplicationId) });

            if (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                return response.FirstOrDefault();
            }

            return null;
        }

        public async Task<CoverLetter> AddAsync(CoverLetter coverLetter)
        {
            var response = await _container.CreateItemAsync(coverLetter, new PartitionKey(coverLetter.JobApplicationId));
            return response.Resource;
        }
    }
}
