import { useRepos, useStats } from "@/hooks/use-repos";
import { Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { AddRepoDialog } from "@/components/AddRepoDialog";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch, Clock, ArrowRight, Shield, Bug, FileText, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ScoreRing } from "@/components/ScoreRing";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: repos, isLoading } = useRepos();
  const { data: stats, isLoading: statsLoading } = useStats();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your tracked repositories.</p>
          </div>
          <AddRepoDialog />
        </header>

        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : stats && (stats.totalRepos > 0 || stats.totalScans > 0) ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={GitBranch}
              label="Repositories"
              value={stats.totalRepos}
              sub={`${stats.completedScans} scans completed`}
              data-testid="stat-repos"
            />
            <StatCard
              icon={BarChart3}
              label="Avg. Health Score"
              value={stats.avgOverall > 0 ? `${stats.avgOverall}/100` : "--"}
              sub="Across all scans"
              color={stats.avgOverall >= 70 ? "text-green-500" : stats.avgOverall >= 40 ? "text-yellow-500" : "text-red-500"}
              data-testid="stat-health"
            />
            <StatCard
              icon={Shield}
              label="Avg. Security"
              value={stats.avgSecurity > 0 ? `${stats.avgSecurity}/100` : "--"}
              sub="Security score"
              color={stats.avgSecurity >= 70 ? "text-green-500" : stats.avgSecurity >= 40 ? "text-yellow-500" : "text-red-500"}
              data-testid="stat-security"
            />
            <StatCard
              icon={Bug}
              label="Issues Found"
              value={stats.totalIssues}
              sub="Total across all files"
              color="text-yellow-500"
              data-testid="stat-issues"
            />
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : !repos?.length ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No repositories tracked</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              Add a GitHub repository URL to start analyzing your codebase health.
            </p>
            <AddRepoDialog />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {repos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, ...props }: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  "data-testid"?: string;
}) {
  return (
    <Card className="p-5" data-testid={props["data-testid"]}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="p-1.5 rounded-md bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className={cn("text-2xl font-bold tracking-tight", color)}>
        {value}
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}

function RepoCard({ repo }: { repo: any }) {
  return (
    <Link href={`/repo/${repo.id}`} className="block group" data-testid={`link-repo-${repo.id}`}>
      <Card className="h-full p-6 hover-elevate relative overflow-visible">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-background rounded-lg border border-border">
            <GitBranch className="w-6 h-6 text-primary" />
          </div>
        </div>
        
        <h3 className="text-lg font-bold truncate pr-4 text-foreground group-hover:text-primary transition-colors">
          {repo.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 truncate">
          {repo.owner}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {repo.lastScannedAt 
              ? `Scanned ${formatDistanceToNow(new Date(repo.lastScannedAt))} ago`
              : "Never scanned"}
          </div>
          <ArrowRight className="w-4 h-4 invisible group-hover:visible" />
        </div>
      </Card>
    </Link>
  );
}
