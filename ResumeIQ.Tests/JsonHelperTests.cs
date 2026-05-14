using ResumeIQ.API.BusinessLogic;

namespace ResumeIQ.Tests;

public class JsonHelperTests
{
    [Fact]
    public void StripCodeFences_PlainJson_ReturnsUnchanged()
    {
        var json = """{"matchScore":85,"missingKeywords":[],"rewrittenBullets":[]}""";
        Assert.Equal(json, JsonHelper.StripCodeFences(json));
    }

    [Fact]
    public void StripCodeFences_JsonFence_StripsWrapper()
    {
        var input = "```json\n{\"matchScore\":85}\n```";
        Assert.Equal("{\"matchScore\":85}", JsonHelper.StripCodeFences(input));
    }

    [Fact]
    public void StripCodeFences_GenericFence_StripsWrapper()
    {
        var input = "```\n{\"matchScore\":85}\n```";
        Assert.Equal("{\"matchScore\":85}", JsonHelper.StripCodeFences(input));
    }

    [Fact]
    public void StripCodeFences_WhitespaceAround_Trims()
    {
        var input = "  \n{\"matchScore\":85}\n  ";
        Assert.Equal("{\"matchScore\":85}", JsonHelper.StripCodeFences(input));
    }
}
