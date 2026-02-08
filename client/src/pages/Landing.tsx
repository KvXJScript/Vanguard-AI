import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Radar, ShieldCheck, Zap, GitGraph } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Radar className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">CodeRadar</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
               <a href="/api/login">Log In</a>
            </Button>
            <Button asChild className="shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
              <a href="/api/login">Get Started</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 lg:py-32">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute top-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50 mix-blend-screen animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-50 mix-blend-screen animate-pulse" style={{ animationDelay: "2s" }} />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent">
              Visual Intelligence for<br />Your Codebase
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Instantly analyze technical debt, security vulnerabilities, and documentation quality using advanced AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20">
                <a href="/api/login">Start Scanning Free</a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-white/10 bg-white/5 hover:bg-white/10">
                <a href="https://github.com" target="_blank" rel="noreferrer">View Demo Repo</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-card/30 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={Zap}
                title="AI Code Analysis"
                description="Our AI engine reads your code like a senior engineer, spotting complexity and anti-patterns instantly."
              />
              <FeatureCard 
                icon={ShieldCheck}
                title="Security First"
                description="Detect hard-coded secrets, injection vulnerabilities, and unsafe dependencies before they merge."
              />
              <FeatureCard 
                icon={GitGraph}
                title="Refactor Suggestions"
                description="Don't just find problems. Get AI-generated refactoring suggestions with side-by-side diffs."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CodeRadar. Built with Convex & Shadcn.</p>
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
