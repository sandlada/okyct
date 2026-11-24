namespace Sandlada.Okyct.Ports.Outbound;

public interface ITokenExporterPort
{
    string ExportTheme(ExportThemeInput input, ExportThemeOptions? options = null);
    string ExportCssVariables(ExportThemeInput input, ExportThemeOptions? options = null);
    string ExportTailwindV4(ExportThemeInput input, ExportThemeOptions? options = null);
    string ExportW3cDesignTokens(ExportThemeInput input, ExportThemeOptions? options = null);
    string ExportTypeScriptTokens(ExportThemeInput input, ExportThemeOptions? options = null);
}
