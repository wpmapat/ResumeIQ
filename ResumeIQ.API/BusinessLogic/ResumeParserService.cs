using DocumentFormat.OpenXml.Packaging;
using UglyToad.PdfPig;

namespace ResumeIQ.API.BusinessLogic
{
    public class ResumeParserService : IResumeParserService
    {
        public string ExtractText(Stream fileStream, string fileExtension)
        {
            return fileExtension.ToLower() switch
            {
                ".pdf" => ExtractFromPdf(fileStream),
                ".docx" => ExtractFromDocx(fileStream),
                _ => throw new NotSupportedException($"File type '{fileExtension}' is not supported. Please upload a PDF or DOCX file.")
            };
        }

        private string ExtractFromPdf(Stream fileStream)
        {
            var bytes = ReadAllBytes(fileStream);
            using var pdf = PdfDocument.Open(bytes);
            var words = pdf.GetPages()
                .SelectMany(page => page.GetWords())
                .Select(word => word.Text);
            return string.Join(" ", words);
        }

        private string ExtractFromDocx(Stream fileStream)
        {
            using var doc = WordprocessingDocument.Open(fileStream, false);
            var body = doc.MainDocumentPart?.Document?.Body;
            if (body == null) return string.Empty;
            return body.InnerText;
        }

        private byte[] ReadAllBytes(Stream stream)
        {
            using var ms = new MemoryStream();
            stream.CopyTo(ms);
            return ms.ToArray();
        }
    }
}
