import { useRepos } from "@/hooks/use-repos";
import { Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { AddRepoDialog } from "@/components/AddRepoDialog";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch, Clock, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ScoreRing } from "@/components/ScoreRing";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: repos, isLoading } = useRepos();

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

        {isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : !repos?.length ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-card/20">
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

function RepoCard({ repo }: { repo: any }) {
  // Mock latest scan score logic - in real app, backend would join this data
  // For now we assume repo might have a 'latestScan' property or similar if modified
  // Or we just display generic info.
  // Assuming the schema update: repo doesn't strictly have latest scan attached in list view by default 
  // unless we join it. Let's assume we display basic info and click through.
  
  return (
    <Link href={`/repo/${repo.id}`} className="block group" data-testid={`link-repo-${repo.id}`}>
      <Card className="h-full p-6 border-white/5 bg-card/50 hover:bg-card hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 relative overflow-visible">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-background rounded-lg border border-white/5">
            <GitBranch className="w-6 h-6 text-primary" />
          </div>
          {/* Badge for status could go here */}
        </div>
        
        <h3 className="text-lg font-bold truncate pr-4 text-foreground group-hover:text-primary transition-colors">
          {repo.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 truncate">
          {repo.owner}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {repo.lastScannedAt 
              ? `Scanned ${formatDistanceToNow(new Date(repo.lastScannedAt))} ago`
              : "Never scanned"}
          </div>
          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
        </div>
      </Card>
    </Link>
  );
}
