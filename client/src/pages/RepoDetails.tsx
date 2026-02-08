import { useRoute, useLocation } from "wouter";
import { useRepo, useRepoScans, useRunScan, useDeleteRepo, useScan } from "@/hooks/use-repos";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Trash2, Github, ExternalLink, Calendar, CheckCircle2, Download, Shield, Bug, FileText, BookOpen, Clock } from "lucide-react";
import { format } from "date-fns";
import { MetricCard } from "@/components/MetricCard";
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export default function RepoDetails() {
  const [match, params] = useRoute("/repo/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");
  const { data: repo, isLoading: repoLoading } = useRepo(id);
  const { data: scans, isLoading: scansLoading } = useRepoScans(id);
  const { mutate: runScan, isPending: isScanning } = useRunScan();
  const { mutate: deleteRepo, isPending: isDeleting } = useDeleteRepo();

  const latestCompletedScan = scans?.find(s => s.status === "completed");
  const latestScan = scans?.[0];

  const scanDetailQuery = useScan(latestCompletedScan?.id ?? 0);
  const scanFiles = scanDetailQuery.data?.files || [];

  if (repoLoading) return <LoadingState />;
  if (!repo) return <NotFoundState />;

  const chartData = [
    { name: "Tech Debt", score: latestCompletedScan?.technicalDebtScore || 0, fill: "#f59e0b" },
    { name: "Security", score: latestCompletedScan?.securityScore || 0, fill: "#ef4444" },
    { name: "Docs", score: latestCompletedScan?.documentationScore || 0, fill: "#3b82f6" },
  ];

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this repository?")) {
      deleteRepo(id, { onSuccess: () => setLocation("/dashboard") });
    }
  };

  const securityIssues = scanFiles.flatMap((f: any) =>
    (f.issues || [])
      .filter((i: any) => i.type === "security")
      .map((i: any) => ({ ...i, filePath: f.filePath }))
  );

  const debtIssues = scanFiles.flatMap((f: any) =>
    (f.issues || [])
      .filter((i: any) => i.type === "debt")
      .map((i: any) => ({ ...i, filePath: f.filePath }))
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight" data-testid="text-repo-name">{repo.name}</h1>
              <Badge variant="outline" className="text-xs font-mono">{repo.defaultBranch}</Badge>
              {latestScan && (
                <Badge
                  variant={latestScan.status === "completed" ? "default" : latestScan.status === "failed" ? "destructive" : "secondary"}
                  className="capitalize"
                  data-testid="badge-scan-status"
                >
                  {latestScan.status === "processing" && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  {latestScan.status}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <a href={repo.url} target="_blank" rel="noreferrer" data-testid="link-github-repo" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Github className="w-4 h-4" /> {repo.owner}/{repo.name} <ExternalLink className="w-3 h-3" />
              </a>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Added {format(new Date(repo.createdAt!), "MMM d, yyyy")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting} data-testid="button-delete-repo">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
            <Button onClick={() => runScan(id)} disabled={isScanning} data-testid="button-run-analysis">
              {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Run Analysis
            </Button>
          </div>
        </div>

        {latestCompletedScan && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="Overall Score"
              value={`${latestCompletedScan.overallScore}/100`}
              icon={CheckCircle2}
              color={latestCompletedScan.overallScore! >= 70 ? "success" : latestCompletedScan.overallScore! >= 40 ? "warning" : "destructive"}
            />
            <MetricCard
              title="Security Score"
              value={`${latestCompletedScan.securityScore}/100`}
              icon={Shield}
              color={latestCompletedScan.securityScore! >= 70 ? "success" : latestCompletedScan.securityScore! >= 40 ? "warning" : "destructive"}
            />
            <MetricCard
              title="Tech Debt Score"
              value={`${latestCompletedScan.technicalDebtScore}/100`}
              icon={Bug}
              color={latestCompletedScan.technicalDebtScore! >= 70 ? "success" : latestCompletedScan.technicalDebtScore! >= 40 ? "warning" : "destructive"}
            />
            <MetricCard
              title="Documentation"
              value={`${latestCompletedScan.documentationScore}/100`}
              icon={BookOpen}
              color={latestCompletedScan.documentationScore! >= 70 ? "success" : latestCompletedScan.documentationScore! >= 40 ? "warning" : "destructive"}
            />
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card/50 border border-border p-1">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
            <TabsTrigger value="debt" data-testid="tab-debt">Tech Debt</TabsTrigger>
            <TabsTrigger value="files" data-testid="tab-files">Files</TabsTrigger>
            <TabsTrigger value="scans" data-testid="tab-scans">Scan History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {!latestCompletedScan ? (
              <EmptyTabState message="No completed scans yet. Run your first analysis to see the overview." />
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-6 min-h-[400px] flex flex-col">
                  <h3 className="font-semibold mb-4">Health Metrics</h3>
                  <div className="flex-1 w-full h-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" barSize={20} data={chartData}>
                        <RadialBar
                          background
                          dataKey="score"
                          cornerRadius={10}
                          label={{ position: "insideStart", fill: "#fff" }}
                        />
                        <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                          itemStyle={{ color: "hsl(var(--foreground))" }}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Latest Summary</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {latestCompletedScan.summary || "No summary available for this scan."}
                  </p>
                  <div className="mt-8">
                    <Button asChild variant="outline" className="w-full">
                      <a href={`/scan/${latestCompletedScan.id}`} data-testid="link-full-report">View Full Report</a>
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="security">
            {!latestCompletedScan ? (
              <EmptyTabState message="Run an analysis to see security findings." />
            ) : scanDetailQuery.isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : securityIssues.length === 0 ? (
              <Card className="p-8 text-center">
                <Shield className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-60" />
                <h3 className="font-semibold mb-2">No Security Issues Found</h3>
                <p className="text-sm text-muted-foreground">Your codebase looks clean from a security perspective.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {securityIssues.map((issue: any, i: number) => (
                  <IssueCard key={i} issue={issue} icon={Shield} testId={`card-security-issue-${i}`} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="debt">
            {!latestCompletedScan ? (
              <EmptyTabState message="Run an analysis to see technical debt findings." />
            ) : scanDetailQuery.isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : debtIssues.length === 0 ? (
              <Card className="p-8 text-center">
                <Bug className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-60" />
                <h3 className="font-semibold mb-2">No Technical Debt Detected</h3>
                <p className="text-sm text-muted-foreground">Your codebase is in great shape.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {debtIssues.map((issue: any, i: number) => (
                  <IssueCard key={i} issue={issue} icon={Bug} testId={`card-debt-issue-${i}`} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files">
            {!latestCompletedScan ? (
              <EmptyTabState message="Run an analysis to see analyzed files." />
            ) : scanDetailQuery.isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : scanFiles.length === 0 ? (
              <EmptyTabState message="No files were analyzed in the latest scan." />
            ) : (
              <div className="space-y-2">
                {scanFiles.map((file: any) => {
                  const issueCount = (file.issues || []).length;
                  const avgScore = Math.round(((file.technicalDebtScore || 0) + (file.securityScore || 0) + (file.documentationScore || 0)) / 3);
                  return (
                    <Card key={file.id} className="p-4 hover-elevate" data-testid={`card-file-${file.id}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate font-mono">{file.filePath}</p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-[10px]">{file.language || "text"}</Badge>
                              {issueCount > 0 && (
                                <span className="text-xs text-yellow-500">{issueCount} issue{issueCount !== 1 ? "s" : ""}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <span className={cn("text-lg font-bold", avgScore >= 70 ? "text-green-500" : avgScore >= 40 ? "text-yellow-500" : "text-red-500")}>{avgScore}</span>
                            <span className="text-[10px] text-muted-foreground block uppercase">Avg Score</span>
                          </div>
                          <Button asChild size="sm" variant="outline" data-testid={`button-file-details-${file.id}`}>
                            <a href={`/scan/${latestCompletedScan.id}`}>View</a>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scans">
            <Card>
              <div className="p-6">
                <h3 className="font-semibold mb-4">History</h3>
                {scansLoading ? (
                  <Skeleton className="h-10 w-full mb-2" />
                ) : !scans?.length ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">No scans have been run yet.</p>
                ) : (
                  <div className="space-y-3">
                    {scans.map((scan) => (
                      <div key={scan.id} data-testid={`row-scan-${scan.id}`} className="flex items-center justify-between gap-4 p-4 rounded-lg bg-background/50 border border-border hover-elevate">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-2.5 h-2.5 rounded-full", scan.status === "completed" ? "bg-green-500" : scan.status === "failed" ? "bg-red-500" : "bg-yellow-500")} />
                          <div>
                            <p className="font-medium text-sm">Scan #{scan.id}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(scan.createdAt!), "PPpp")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 flex-wrap">
                          {scan.status === "processing" && (
                            <div className="flex items-center gap-2 text-sm text-yellow-500">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing
                            </div>
                          )}
                          <div className="text-right">
                            <span className="text-sm font-bold block">{scan.status === "completed" ? scan.overallScore : "--"}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">Score</span>
                          </div>
                          {scan.status === "completed" && (
                            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); window.open(`/api/scans/${scan.id}/export`, "_blank"); }} data-testid={`button-export-scan-${scan.id}`}>
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          <Button asChild size="sm" variant="ghost" data-testid={`button-scan-details-${scan.id}`}>
                            <a href={`/scan/${scan.id}`}>Details</a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function IssueCard({ issue, icon: Icon, testId }: { issue: any; icon: any; testId: string }) {
  return (
    <Card className="p-5" data-testid={testId}>
      <div className="flex items-start gap-4">
        <div className={cn("p-2 rounded-lg shrink-0", issue.severity === "high" ? "bg-red-500/10" : issue.severity === "medium" ? "bg-yellow-500/10" : "bg-blue-500/10")}>
          <Icon className={cn("w-5 h-5", issue.severity === "high" ? "text-red-500" : issue.severity === "medium" ? "text-yellow-500" : "text-blue-500")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm">{issue.description}</span>
            <Badge variant="outline" className={cn("text-[10px] uppercase",
              issue.severity === "high" ? "text-red-400 border-red-400/30" :
              issue.severity === "medium" ? "text-yellow-400 border-yellow-400/30" :
              "text-blue-400 border-blue-400/30"
            )}>
              {issue.severity}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono">{issue.filePath}{issue.line ? `:${issue.line}` : ""}</p>
          {issue.suggestion && (
            <p className="text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded">{issue.suggestion}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function EmptyTabState({ message }: { message: string }) {
  return (
    <div className="text-center py-20 border border-dashed border-border rounded-xl">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <Skeleton className="h-12 w-1/3 mb-8" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </main>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Repository Not Found</h2>
          <Button asChild variant="ghost" size="sm">
            <a href="/dashboard">Return Dashboard</a>
          </Button>
        </div>
      </main>
    </div>
  );
}
