namespace ResumeIQ.API.BusinessLogic
{
    internal static class JsonHelper
    {
        internal static string StripCodeFences(string text)
        {
            var trimmed = text.Trim();
            if (trimmed.StartsWith("```"))
            {
                var firstNewline = trimmed.IndexOf('\n');
                if (firstNewline >= 0) trimmed = trimmed[(firstNewline + 1)..];
                if (trimmed.EndsWith("```")) trimmed = trimmed[..^3].TrimEnd();
            }
            return trimmed;
        }
    }
}
