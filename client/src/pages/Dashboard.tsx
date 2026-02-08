import { useRepos, useStats } from "@/hooks/use-repos";
import { Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { AddRepoDialog } from "@/components/AddRepoDialog";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  GitBranch, Clock, ArrowRight, Shield, Bug, BarChart3,
  Code2, FileSearch, Zap, Download, ChevronRight, Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { data: repos, isLoading } = useRepos();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const recentRepos = repos?.slice(0, 3);
  const firstName = user?.firstName || user?.email?.split("@")[0] || "there";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">

        <div className={cn(
          "mb-10 transition-all duration-600",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"
        )}>
          <h1 className="text-3xl font-bold tracking-tight mb-1" data-testid="text-dashboard-title">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's an overview of your code intelligence platform.
          </p>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <AnimatedStatCard
              icon={GitBranch}
              label="Repositories"
              value={stats?.totalRepos ?? 0}
              sub={`${stats?.completedScans ?? 0} scans completed`}
              index={0}
              mounted={mounted}
              data-testid="stat-repos"
            />
            <AnimatedStatCard
              icon={BarChart3}
              label="Avg. Health Score"
              value={stats?.avgOverall > 0 ? `${stats.avgOverall}/100` : "--"}
              sub="Across all scans"
              color={stats?.avgOverall >= 70 ? "text-green-500" : stats?.avgOverall >= 40 ? "text-yellow-500" : "text-red-500"}
              index={1}
              mounted={mounted}
              data-testid="stat-health"
            />
            <AnimatedStatCard
              icon={Shield}
              label="Avg. Security"
              value={stats?.avgSecurity > 0 ? `${stats.avgSecurity}/100` : "--"}
              sub="Security score"
              color={stats?.avgSecurity >= 70 ? "text-green-500" : stats?.avgSecurity >= 40 ? "text-yellow-500" : "text-red-500"}
              index={2}
              mounted={mounted}
              data-testid="stat-security"
            />
            <AnimatedStatCard
              icon={Bug}
              label="Issues Found"
              value={stats?.totalIssues ?? 0}
              sub="Total across all files"
              color="text-yellow-500"
              index={3}
              mounted={mounted}
              data-testid="stat-issues"
            />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <Card className={cn(
            "lg:col-span-2 p-6 transition-all duration-500 delay-200",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}>
            <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Recent Repositories</h2>
              </div>
              <Link href="/repos">
                <Button variant="ghost" size="sm" data-testid="link-view-all-repos">
                  View all <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : !recentRepos?.length ? (
              <div className="text-center py-10 border border-dashed border-border rounded-lg">
                <GitBranch className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No repositories tracked yet.</p>
                <AddRepoDialog />
              </div>
            ) : (
              <div className="space-y-3">
                {recentRepos.map((repo: any, i: number) => (
                  <Link key={repo.id} href={`/repo/${repo.id}`} className="block group" data-testid={`link-recent-repo-${repo.id}`}>
                    <div className={cn(
                      "flex items-center justify-between gap-4 p-4 rounded-lg border border-border hover-elevate transition-all duration-400 flex-wrap",
                      mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                    )} style={{ transitionDelay: `${300 + i * 100}ms` }}>
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <GitBranch className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{repo.name}</p>
                          <p className="text-xs text-muted-foreground">{repo.owner}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {repo.lastScannedAt
                            ? formatDistanceToNow(new Date(repo.lastScannedAt)) + " ago"
                            : "Not scanned"}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground invisible group-hover:visible" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className={cn(
            "p-6 transition-all duration-500 delay-300",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Quick Actions</h2>
            </div>
            <div className="space-y-3">
              <AddRepoDialog />
              <Link href="/repos">
                <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-browse-repos">
                  <FileSearch className="w-4 h-4" />
                  Browse Repositories
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className={cn(
          "transition-all duration-600 delay-400",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Code2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">How Vanguard AI Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: GitBranch,
                title: "Connect Repository",
                description: "Add any public GitHub repository URL. Vanguard AI automatically discovers source files and prepares them for analysis.",
                step: "01",
              },
              {
                icon: Shield,
                title: "AI-Powered Analysis",
                description: "Google Gemini scans each file for security vulnerabilities, technical debt, and documentation gaps, scoring them from 0 to 100.",
                step: "02",
              },
              {
                icon: Download,
                title: "Review & Export",
                description: "Explore detailed results with code diffs showing suggested improvements. Export reports as standalone HTML files to share with your team.",
                step: "03",
              },
            ].map((item, i) => (
              <Card key={i} className={cn(
                "p-6 relative overflow-visible transition-all duration-500",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )} style={{ transitionDelay: `${500 + i * 120}ms` }}>
                <span className="text-4xl font-black text-primary/10 absolute top-4 right-4 select-none">
                  {item.step}
                </span>
                <div className="p-2 rounded-lg bg-primary/10 w-fit mb-4">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

function AnimatedStatCard({ icon: Icon, label, value, sub, color, index, mounted, ...props }: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  index: number;
  mounted: boolean;
  "data-testid"?: string;
}) {
  return (
    <Card
      className={cn(
        "p-5 transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{ transitionDelay: `${100 + index * 80}ms` }}
      data-testid={props["data-testid"]}
    >
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
