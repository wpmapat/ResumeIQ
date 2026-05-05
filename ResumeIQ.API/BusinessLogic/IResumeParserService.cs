namespace ResumeIQ.API.BusinessLogic
{
    public interface IResumeParserService
    {
        string ExtractText(Stream fileStream, string fileExtension);
    }
}
