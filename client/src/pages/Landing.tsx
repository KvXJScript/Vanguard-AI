import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Code2, ShieldCheck, Zap, GitGraph, BarChart3, Globe } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Code2 className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight" data-testid="text-brand">KvX</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Button asChild variant="ghost" className="hidden sm:inline-flex" data-testid="button-login">
               <a href="/api/login">Log In</a>
            </Button>
            <Button asChild className="shadow-lg shadow-primary/25" data-testid="button-get-started">
              <a href="/api/login">Get Started</a>
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute top-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50 mix-blend-screen animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-50 mix-blend-screen animate-pulse" style={{ animationDelay: "2s" }} />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent" data-testid="text-hero-title">
              Code Intelligence<br />by KvX
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed" data-testid="text-hero-description">
              Multi-agent AI analysis for technical debt, security vulnerabilities, and documentation quality. Scan GitHub repositories and export standalone reports.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20" data-testid="button-start-scanning">
                <a href="/api/login">Start Scanning Free</a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-white/10 bg-white/5" data-testid="button-github">
                <a href="https://github.com" target="_blank" rel="noreferrer">View on GitHub</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-24 bg-card/30 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4" data-testid="text-features-title">Enterprise-Grade Analysis</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Parallel multi-agent AI pipeline analyzing security, performance, and documentation in real-time.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={Zap}
                title="Multi-Agent AI"
                description="Parallel AI agents for security, performance, and documentation analyze your codebase simultaneously."
              />
              <FeatureCard 
                icon={ShieldCheck}
                title="Security Scanning"
                description="Detect hard-coded secrets, injection vulnerabilities, and unsafe dependencies before they ship."
              />
              <FeatureCard 
                icon={GitGraph}
                title="AI Refactoring"
                description="Get AI-generated code refactoring with side-by-side diff comparisons for every file."
              />
              <FeatureCard 
                icon={BarChart3}
                title="Debt Tracking"
                description="Track technical debt scores across repositories over time with advanced analytics dashboards."
              />
              <FeatureCard 
                icon={Globe}
                title="GitHub Pages Export"
                description="Export scan reports as standalone static sites deployable to GitHub Pages with one click."
              />
              <FeatureCard 
                icon={Code2}
                title="Code Intelligence"
                description="Deep analysis of code patterns, complexity metrics, and documentation coverage powered by KvX."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p data-testid="text-footer">&copy; {new Date().getFullYear()} KvX. Code Intelligence Platform.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-card border border-white/5 hover:border-primary/20 transition-all duration-300 group">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
