import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CodeDiffViewerProps {
  original: string;
  modified: string;
  language?: string;
  className?: string;
}

export function CodeDiffViewer({ original, modified, className }: CodeDiffViewerProps) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-4 h-[500px]", className)}>
      <div className="flex flex-col border rounded-lg overflow-hidden bg-background">
        <div className="bg-muted/50 px-4 py-2 border-b text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Original
        </div>
        <ScrollArea className="flex-1">
          <pre className="p-4 text-xs font-mono leading-relaxed text-red-100/70 bg-red-950/10 h-full w-full whitespace-pre-wrap">
            {original || "// No original content"}
          </pre>
        </ScrollArea>
      </div>

      <div className="flex flex-col border rounded-lg overflow-hidden bg-background">
        <div className="bg-muted/50 px-4 py-2 border-b text-xs font-mono text-muted-foreground uppercase tracking-wider text-green-400">
          Optimized
        </div>
        <ScrollArea className="flex-1">
          <pre className="p-4 text-xs font-mono leading-relaxed text-green-100/90 bg-green-950/10 h-full w-full whitespace-pre-wrap">
            {modified || "// No suggested changes"}
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
}
