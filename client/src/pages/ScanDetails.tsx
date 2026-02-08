import { useRoute } from "wouter";
import { useScan } from "@/hooks/use-repos";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CodeDiffViewer } from "@/components/CodeDiffViewer";
import { ChevronLeft, FileText, AlertCircle, Shield, Book, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ScanDetails() {
  const [match, params] = useRoute("/scan/:id");
  const id = parseInt(params?.id || "0");
  const { data, isLoading } = useScan(id);

  if (isLoading) return null; // Or skeleton
  if (!data) return <div>Scan not found</div>;

  const { scan, files } = data;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="p-6 border-b border-border bg-card/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon" className="rounded-full">
              <a href={`/repo/${scan.repoId}`}><ChevronLeft className="w-5 h-5" /></a>
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                Scan Report #{scan.id}
                <Badge variant={scan.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                  {scan.status}
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Analyzed {files.length} files</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <ScoreBlock label="Overall" score={scan.overallScore} />
             <div className="w-px h-8 bg-border" />
             <ScoreBlock label="Tech Debt" score={scan.technicalDebtScore} color="text-yellow-500" />
             <ScoreBlock label="Security" score={scan.securityScore} color="text-red-500" />
          </div>
        </header>

        {/* Content - Two Pane Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* File List */}
          <div className="w-1/3 border-r border-border bg-card/20 flex flex-col">
            <div className="p-4 border-b border-border bg-card/40 font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Analyzed Files
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {files.map((file) => (
                  <FileListItem key={file.id} file={file} />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Details Placeholder (Empty State) */}
          <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground bg-black/20">
             <div className="text-center max-w-md">
               <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
               <h3 className="text-lg font-medium mb-2">Select a file to view analysis</h3>
               <p className="text-sm opacity-60">
                 Review AI-detected issues and suggested refactors for each file in your codebase.
               </p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ScoreBlock({ label, score, color }: { label: string, score: number | null, color?: string }) {
  return (
    <div className="text-center">
      <div className={cn("text-2xl font-bold tracking-tight", color)}>{score ?? "-"}</div>
      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">{label}</div>
    </div>
  );
}

function FileListItem({ file }: { file: any }) {
  // We use a Dialog for the file details to keep context
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="w-full text-left p-3 rounded-lg hover:bg-primary/10 transition-colors group border border-transparent hover:border-primary/20">
          <div className="flex items-center justify-between mb-1">
            <div className="font-medium text-sm truncate flex items-center gap-2">
               <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
               <span className="truncate">{file.filePath}</span>
            </div>
            {/* Severity Dot based on issues? Simplified for now */}
            {(file.technicalDebtScore || 0) < 50 && <div className="w-2 h-2 rounded-full bg-red-500" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
             <span className="bg-background/50 px-1.5 py-0.5 rounded border border-white/5">{file.language || "text"}</span>
             <span>Score: {file.technicalDebtScore ?? "-"}</span>
          </div>
        </button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader className="p-6 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-3">
             <FileText className="w-5 h-5 text-primary" />
             {file.filePath}
             <Badge variant="outline" className="ml-auto">{file.language}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden grid grid-cols-3">
           {/* Issues Column */}
           <div className="col-span-1 border-r border-border flex flex-col overflow-hidden bg-card/20">
             <div className="p-4 font-semibold text-sm border-b border-border">Identified Issues</div>
             <ScrollArea className="flex-1 p-4">
               {(!file.issues || file.issues.length === 0) ? (
                 <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                   <Check className="w-8 h-8 mb-2 text-green-500 opacity-50" />
                   No issues found
                 </div>
               ) : (
                 <div className="space-y-4">
                   {file.issues.map((issue: any, i: number) => (
                     <Card key={i} className="p-4 border-l-4 border-l-red-500 bg-card/50">
                        <div className="flex items-center gap-2 mb-2">
                           <Badge variant="outline" className={cn(
                             "text-[10px] uppercase",
                             issue.type === 'security' ? 'text-red-400 border-red-400/30' : 
                             issue.type === 'debt' ? 'text-yellow-400 border-yellow-400/30' : 
                             'text-blue-400 border-blue-400/30'
                           )}>
                             {issue.type}
                           </Badge>
                           <span className="text-xs font-mono opacity-50 ml-auto">Line {issue.line || "?"}</span>
                        </div>
                        <p className="text-sm font-medium mb-2">{issue.description}</p>
                        {issue.suggestion && (
                          <div className="text-xs text-muted-foreground bg-black/20 p-2 rounded">
                            💡 {issue.suggestion}
                          </div>
                        )}
                     </Card>
                   ))}
                 </div>
               )}
             </ScrollArea>
           </div>

           {/* Diff Viewer Column (wider) */}
           <div className="col-span-2 flex flex-col overflow-hidden bg-black/10">
             <div className="p-4 font-semibold text-sm border-b border-border flex justify-between">
               <span>AI Optimization Proposal</span>
               <span className="text-xs font-normal text-muted-foreground">Original vs. Refactored</span>
             </div>
             <div className="flex-1 p-4 overflow-hidden">
               <CodeDiffViewer 
                 original={file.originalCode} 
                 modified={file.refactoredCode} 
                 className="h-full"
               />
             </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
