using Microsoft.Azure.Cosmos;
using ResumeIQ.API.Models;

namespace ResumeIQ.API.BusinessLogic
{
    public class AIAnalysisRepository : IAIAnalysisRepository
    {
        private readonly Container _container;

        public AIAnalysisRepository(CosmosClient cosmosClient, IConfiguration configuration)
        {
            var databaseName = configuration["CosmosDb:DatabaseName"]!;
            _container = cosmosClient.GetContainer(databaseName, "AIAnalyses");
        }

        public async Task<AIAnalysis?> GetLatestByJobApplicationIdAsync(string jobApplicationId)
        {
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.jobApplicationId = @jobApplicationId ORDER BY c.createdAt DESC OFFSET 0 LIMIT 1")
                .WithParameter("@jobApplicationId", jobApplicationId);

            using var iterator = _container.GetItemQueryIterator<AIAnalysis>(query,
                requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(jobApplicationId) });

            if (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                return response.FirstOrDefault();
            }

            return null;
        }

        public async Task<AIAnalysis> AddAsync(AIAnalysis analysis)
        {
            var response = await _container.CreateItemAsync(analysis, new PartitionKey(analysis.JobApplicationId));
            return response.Resource;
        }
    }
}
