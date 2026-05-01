using Newtonsoft.Json;

namespace ResumeIQ.API.Models
{
    public enum ApplicationStatus
    {
        Applied,
        Interview,
        Offer,
        Rejected
    }

    public class JobApplication
    {
        [JsonProperty("id")]
        public string Id { get; set; } = string.Empty;

        [JsonProperty("userId")]
        public string UserId { get; set; } = string.Empty;

        [JsonProperty("companyName")]
        public string CompanyName { get; set; } = string.Empty;

        [JsonProperty("roleTitle")]
        public string RoleTitle { get; set; } = string.Empty;

        [JsonProperty("jobDescription")]
        public string JobDescription { get; set; } = string.Empty;

        [JsonProperty("status")]
        public ApplicationStatus Status { get; set; } = ApplicationStatus.Applied;

        [JsonProperty("appliedDate")]
        public DateTime AppliedDate { get; set; }

        [JsonProperty("notes")]
        public string Notes { get; set; } = string.Empty;

        [JsonProperty("createdAt")]
        public DateTime CreatedAt { get; set; }
    }
}
