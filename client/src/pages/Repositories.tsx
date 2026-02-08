import { useRepos } from "@/hooks/use-repos";
import { Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { AddRepoDialog } from "@/components/AddRepoDialog";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Clock, ArrowRight, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function Repositories() {
  const { data: repos, isLoading } = useRepos();
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = repos?.filter((r: any) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.owner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className={cn(
          "flex items-center justify-between gap-4 mb-8 flex-wrap transition-all duration-500",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        )}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-repos-title">Repositories</h1>
            <p className="text-muted-foreground mt-1">Manage and analyze your GitHub repositories.</p>
          </div>
          <AddRepoDialog />
        </header>

        <div className={cn(
          "mb-6 transition-all duration-500 delay-100",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-repos"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : !filtered?.length ? (
          <div className={cn(
            "text-center py-20 border border-dashed border-border rounded-xl transition-all duration-500 delay-200",
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}>
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {search ? "No repositories match your search" : "No repositories tracked"}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              {search
                ? "Try a different search term or add a new repository."
                : "Add a GitHub repository URL to start analyzing your codebase health."}
            </p>
            {!search && <AddRepoDialog />}
          </div>
        ) : (
          <>
            <div className={cn(
              "mb-4 transition-all duration-300 delay-150",
              mounted ? "opacity-100" : "opacity-0"
            )}>
              <Badge variant="secondary" className="no-default-active-elevate">
                {filtered.length} {filtered.length === 1 ? "repository" : "repositories"}
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((repo: any, index: number) => (
                <RepoCard key={repo.id} repo={repo} index={index} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function RepoCard({ repo, index }: { repo: any; index: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80 * index);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <Link href={`/repo/${repo.id}`} className="block group" data-testid={`link-repo-${repo.id}`}>
      <Card className={cn(
        "h-full p-6 hover-elevate relative overflow-visible transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}>
        <div className="flex justify-between items-start gap-2 mb-4">
          <div className="p-2 bg-background rounded-lg border border-border">
            <GitBranch className="w-6 h-6 text-primary" />
          </div>
        </div>

        <h3 className="text-lg font-bold truncate pr-4 text-foreground">
          {repo.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 truncate">
          {repo.owner}
        </p>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mt-auto pt-4 border-t border-border flex-wrap">
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
