import { ExternalLink, Database, Search, Eye } from "lucide-react";

export function DatabaseRichResult({ stdout }: { stdout: string }) {
  try {
    const data = JSON.parse(stdout);
    if (!Array.isArray(data) || data.length === 0) return null;
    
    const headers = Object.keys(data[0]);
    return (
      <div className="flex flex-col gap-2 rounded-md border p-2 mt-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Database className="h-4 w-4" />
          <span>Database Query Results</span>
        </div>
        <div className="max-h-60 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  {headers.map((h) => (
                    <td key={h} className="px-4 py-2">{String(row[h])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (e) {
    return null;
  }
}

export function WebSearchRichResult({ stdout }: { stdout: string }) {
  try {
    const data = JSON.parse(stdout);
    if (!Array.isArray(data)) return null;

    return (
      <div className="flex flex-col gap-2 rounded-md border p-2 mt-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Search className="h-4 w-4" />
          <span>Web Search Results</span>
        </div>
        <div className="flex flex-col gap-3">
          {data.map((result: any, i: number) => (
            <div key={i} className="flex flex-col gap-1">
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline font-medium flex items-center gap-1"
              >
                {result.title}
                <ExternalLink className="h-3 w-3" />
              </a>
              <p className="text-xs text-muted-foreground">{result.snippet}</p>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (e) {
    return null;
  }
}

export function VisionRichResult({ stdout }: { stdout: string }) {
  try {
    const data = JSON.parse(stdout);
    return (
      <div className="flex flex-col gap-2 rounded-md border p-2 mt-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span>Vision Analysis</span>
        </div>
        <p className="text-sm">{data.description || data.analysis}</p>
        {data.objects && data.objects.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {data.objects.map((obj: string, i: number) => (
              <span key={i} className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                {obj}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  } catch (e) {
    return null;
  }
}
