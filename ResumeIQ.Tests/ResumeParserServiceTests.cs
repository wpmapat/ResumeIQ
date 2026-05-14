using ResumeIQ.API.BusinessLogic;

namespace ResumeIQ.Tests;

public class ResumeParserServiceTests
{
    private readonly ResumeParserService _sut = new();

    [Fact]
    public void ExtractText_UnsupportedExtension_ThrowsNotSupportedException()
    {
        using var stream = new MemoryStream([0x00]);
        Assert.Throws<NotSupportedException>(() => _sut.ExtractText(stream, ".txt"));
    }

    [Fact]
    public void ExtractText_UnsupportedExtension_MessageContainsExtension()
    {
        using var stream = new MemoryStream([0x00]);
        var ex = Assert.Throws<NotSupportedException>(() => _sut.ExtractText(stream, ".xyz"));
        Assert.Contains(".xyz", ex.Message);
    }

    [Fact]
    public void ExtractText_ExtensionIsCaseInsensitive()
    {
        using var stream = new MemoryStream([0x00]);
        // .PDF (uppercase) should not throw NotSupportedException — it should attempt PDF parsing
        var ex = Assert.ThrowsAny<Exception>(() => _sut.ExtractText(stream, ".PDF"));
        Assert.IsNotType<NotSupportedException>(ex);
    }
}
