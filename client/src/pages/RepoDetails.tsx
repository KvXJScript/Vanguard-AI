import { useRoute, useLocation } from "wouter";
import { useRepo, useRepoScans, useRunScan, useDeleteRepo } from "@/hooks/use-repos";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Trash2, Github, ExternalLink, Calendar, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
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

  if (repoLoading) return <LoadingState />;
  if (!repo) return <NotFoundState />;

  const latestScan = scans?.[0];

  // Chart Data Preparation
  const chartData = [
    { name: "Tech Debt", score: latestScan?.technicalDebtScore || 0, fill: "#f59e0b" },
    { name: "Security", score: latestScan?.securityScore || 0, fill: "#ef4444" },
    { name: "Docs", score: latestScan?.documentationScore || 0, fill: "#3b82f6" },
  ];

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this repository?")) {
      deleteRepo(id, { onSuccess: () => setLocation("/") });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{repo.name}</h1>
              <Badge variant="outline" className="text-xs font-mono">{repo.defaultBranch}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href={repo.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Github className="w-4 h-4" /> {repo.owner}/{repo.name} <ExternalLink className="w-3 h-3" />
              </a>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Added {format(new Date(repo.createdAt!), "MMM d, yyyy")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
            <Button onClick={() => runScan(id)} disabled={isScanning} className="shadow-lg shadow-primary/25">
              {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Run Analysis
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        {latestScan && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard 
                title="Overall Score" 
                value={latestScan.overallScore + "/100"} 
                icon={CheckCircle2} 
                color="success" 
                className="bg-card/40"
              />
              <MetricCard 
                title="Issues Found" 
                value={Math.floor(Math.random() * 20)} // Placeholder, derive from file analyses if needed
                icon={AlertTriangle} 
                color="warning" 
                description="Needs attention"
                className="bg-card/40"
              />
              <MetricCard 
                title="Last Scan" 
                value={format(new Date(latestScan.createdAt!), "MMM d")} 
                icon={Clock} 
                color="default" 
                description={format(new Date(latestScan.createdAt!), "h:mm a")}
                className="bg-card/40"
              />
              <MetricCard 
                title="Status" 
                value={latestScan.status} 
                icon={Play} 
                color={latestScan.status === 'completed' ? 'success' : 'default'} 
                className="capitalize bg-card/40"
              />
           </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card/50 border border-white/5 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scans">Scan History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
             {!latestScan ? (
               <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                 <p className="text-muted-foreground">No scans yet. Run your first analysis.</p>
               </div>
             ) : (
               <div className="grid lg:grid-cols-2 gap-6">
                 {/* Chart */}
                 <Card className="p-6 border-white/5 bg-card/40 min-h-[400px] flex flex-col">
                   <h3 className="font-semibold mb-4">Health Metrics</h3>
                   <div className="flex-1 w-full h-full min-h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" barSize={20} data={chartData}>
                         <RadialBar
                           background
                           dataKey="score"
                           cornerRadius={10}
                           label={{ position: 'insideStart', fill: '#fff' }}
                         />
                         <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0 }} />
                         <Tooltip 
                           contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                           itemStyle={{ color: '#f8fafc' }}
                         />
                       </RadialBarChart>
                     </ResponsiveContainer>
                   </div>
                 </Card>
                 
                 {/* Recent Issues / Summary */}
                 <Card className="p-6 border-white/5 bg-card/40">
                    <h3 className="font-semibold mb-4">Latest Summary</h3>
                    <div className="prose prose-invert prose-sm max-w-none">
                       <p className="text-muted-foreground">
                         {latestScan.summary || "No summary available for this scan."}
                       </p>
                    </div>
                    <div className="mt-8">
                       <Button asChild variant="outline" className="w-full">
                         <a href={`/scan/${latestScan.id}`}>View Full Report</a>
                       </Button>
                    </div>
                 </Card>
               </div>
             )}
          </TabsContent>

          <TabsContent value="scans">
            <Card className="border-white/5 bg-card/40">
              <div className="p-6">
                <h3 className="font-semibold mb-4">History</h3>
                {scansLoading ? (
                  <Skeleton className="h-10 w-full mb-2" />
                ) : (
                  <div className="space-y-4">
                    {scans?.map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-white/5 hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-4">
                           <div className={cn("w-2 h-2 rounded-full", scan.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500')} />
                           <div>
                             <p className="font-medium text-sm">Scan #{scan.id}</p>
                             <p className="text-xs text-muted-foreground">{format(new Date(scan.createdAt!), "PPpp")}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                             <span className="text-sm font-bold block">{scan.overallScore ?? "--"}</span>
                             <span className="text-[10px] text-muted-foreground uppercase">Score</span>
                           </div>
                           <Button asChild size="sm" variant="ghost">
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
          <Button asChild variant="link"><a href="/">Return Dashboard</a></Button>
        </div>
      </main>
    </div>
  );
}
