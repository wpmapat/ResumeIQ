using Newtonsoft.Json;

namespace ResumeIQ.API.Models
{
    public class Resume
    {
        [JsonProperty("id")]
        public string Id { get; set; } = string.Empty;

        [JsonProperty("userId")]
        public string UserId { get; set; } = string.Empty;

        [JsonProperty("fileName")]
        public string FileName { get; set; } = string.Empty;

        [JsonProperty("blobUrl")]
        public string BlobUrl { get; set; } = string.Empty;

        [JsonProperty("extractedText")]
        public string ExtractedText { get; set; } = string.Empty;

        [JsonProperty("uploadedAt")]
        public DateTime UploadedAt { get; set; }

        [JsonProperty("isPreferred")]
        public bool IsPreferred { get; set; }
    }
}
