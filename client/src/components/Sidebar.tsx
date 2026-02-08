import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, GitBranch, LogOut, Code2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/repos", icon: GitBranch, label: "Repositories" },
  ];

  return (
    <div className="w-64 h-screen border-r border-border bg-card/30 flex flex-col sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary/20 p-2 rounded-lg">
          <Code2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight" data-testid="text-sidebar-brand">Vanguard AI</h1>
          <p className="text-xs text-muted-foreground">Code Intelligence</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase()}`} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover-elevate",
              isActive 
                ? "bg-primary/10 text-primary shadow-sm border border-primary/10" 
                : "text-muted-foreground"
            )}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {(user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">{user?.firstName || "User"}</p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => logout()}
          data-testid="button-logout"
          className="w-full justify-start gap-3 text-muted-foreground"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
