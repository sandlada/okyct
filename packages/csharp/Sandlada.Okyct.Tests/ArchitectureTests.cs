using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace Sandlada.Okyct.Tests;

public sealed class ArchitectureTests
{
    [Test]
    public async Task ActualSymbolReferencesFollowHexagonalBoundaries()
    {
        var cancellationToken = TestContext.Current!.Execution.CancellationToken;
        var sourceDirectory = FindSourceDirectory();
        var sources = Directory.EnumerateFiles(sourceDirectory, "*.cs", SearchOption.AllDirectories)
            .Where(file => !Path.GetRelativePath(sourceDirectory, file).Split(Path.DirectorySeparatorChar)
                .Any(part => part is "bin" or "obj"))
            .Select(file => CSharpSyntaxTree.ParseText(File.ReadAllText(file), path: file, cancellationToken: cancellationToken))
            .ToArray();
        var implicitUsings = CSharpSyntaxTree.ParseText("""
            global using System;
            global using System.Collections.Generic;
            global using System.Linq;
            """, cancellationToken: cancellationToken);
        var platform = (string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!;
        var assemblies = platform.Split(Path.PathSeparator)
            .Where(path => Path.GetFileName(path) != "Sandlada.Okyct.dll")
            .Select(path => MetadataReference.CreateFromFile(path));
        var compilation = CSharpCompilation.Create("Sandlada.Okyct", sources.Append(implicitUsings), assemblies,
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
        var references = new HashSet<ArchitectureReference>();

        foreach (var source in sources)
        {
            var root = source.GetRoot(cancellationToken);
            var sourceNamespace = root.DescendantNodes().OfType<BaseNamespaceDeclarationSyntax>()
                .First().Name.ToString();
            var model = compilation.GetSemanticModel(source);
            foreach (var node in root.DescendantNodes().OfType<SimpleNameSyntax>())
            {
                var target = model.GetSymbolInfo(node, cancellationToken).Symbol;
                if (target is not (INamedTypeSymbol or IMethodSymbol or IFieldSymbol or IPropertySymbol)) continue;
                if (target.ContainingNamespace is null || target.ContainingAssembly is null) continue;

                references.Add(new ArchitectureReference(Path.GetRelativePath(sourceDirectory, source.FilePath),
                    sourceNamespace, target.ContainingNamespace.ToDisplayString(), target.ContainingAssembly.Name));
            }
        }

        await Assert.That(references).IsNotEmpty();
        var result = ArchitectureGuard.VerifyHexagonalArchitectureBoundaries(references);
        await Assert.That(result.Violations).IsEmpty();
    }

    [Test]
    public async Task GuardRejectsOutwardAndPortServiceReferences()
    {
        var result = ArchitectureGuard.VerifyHexagonalArchitectureBoundaries([
            new("Colors.cs", "Sandlada.Okyct.Domain.Services", "Sandlada.Okyct.Adapters", "Sandlada.Okyct"),
            new("Port.cs", "Sandlada.Okyct.Ports.Outbound", "Sandlada.Okyct.Domain.Services", "Sandlada.Okyct"),
            new("Scheme.cs", "Sandlada.Okyct.Application", "Sandlada.Okyct.Adapters", "Sandlada.Okyct"),
            new("Port.cs", "Sandlada.Okyct.Ports.Inbound", "Sandlada.Okyct.Domain.Models", "Sandlada.Okyct")
        ]);
        await Assert.That(result.Passed).IsFalse();
        await Assert.That(result.Violations.Count).IsEqualTo(3);
    }

    private static string FindSourceDirectory()
    {
        for (var current = new DirectoryInfo(AppContext.BaseDirectory); current is not null; current = current.Parent)
        {
            var candidate = Path.Combine(current.FullName, "Sandlada.Okyct");
            if (File.Exists(Path.Combine(candidate, "Sandlada.Okyct.csproj"))) return candidate;
        }
        throw new DirectoryNotFoundException("Could not locate the Sandlada.Okyct source project.");
    }
}
