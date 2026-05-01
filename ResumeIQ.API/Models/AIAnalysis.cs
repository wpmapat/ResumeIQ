using Newtonsoft.Json;

namespace ResumeIQ.API.Models
{
    public class AIAnalysis
    {
        [JsonProperty("id")]
        public string Id { get; set; } = string.Empty;

        [JsonProperty("jobApplicationId")]
        public string JobApplicationId { get; set; } = string.Empty;

        [JsonProperty("userId")]
        public string UserId { get; set; } = string.Empty;

        [JsonProperty("matchScore")]
        public int MatchScore { get; set; }

        [JsonProperty("missingKeywords")]
        public List<string> MissingKeywords { get; set; } = new();

        [JsonProperty("rewrittenBullets")]
        public List<string> RewrittenBullets { get; set; } = new();

        [JsonProperty("createdAt")]
        public DateTime CreatedAt { get; set; }
    }
}
