import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Users, Zap, Shield } from "lucide-react";

export default async function LandingPage() {
  // Only check auth if Supabase is configured
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project.supabase.co"
  ) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { redirect } = await import("next/navigation");
      redirect("/app/today");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Partner Metrics</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-20 md:py-32 flex flex-col items-center text-center gap-8">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-muted-foreground animate-fade-in">
            <Zap className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Built for two. Designed for daily use.
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl animate-slide-up bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Track daily metrics together, effortlessly
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl animate-slide-up" style={{ animationDelay: "100ms" }}>
            A private, calm space for two people to log habits, share progress,
            and stay consistent — one tap at a time.
          </p>

          <div className="flex gap-3 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <Button size="lg" asChild>
              <Link href="/signup">
                Start tracking
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="container py-16 md:py-24">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Fast daily logging",
                description: "One tap for booleans, quick steppers for counts, and smart chips for durations. Most updates take under 3 seconds.",
              },
              {
                icon: Users,
                title: "Shared & personal",
                description: "Track shared goals like hydration and exercise together, while keeping personal metrics like mood or job applications private.",
              },
              {
                icon: Shield,
                title: "Private by design",
                description: "No social features, no gamification pressure. Just a calm, trustworthy space for two people to build better habits.",
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border bg-card p-6 md:p-8 transition-all hover:shadow-lg hover:border-primary/20 animate-slide-up"
                style={{ animationDelay: `${(i + 1) * 100}ms` }}
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container py-16 md:py-24">
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/10 p-8 md:p-16 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to track together?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Create your household in under a minute. Invite your partner and start logging today.
            </p>
            <Button size="lg" asChild>
              <Link href="/signup">
                Create your household
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <BarChart3 className="h-3 w-3 text-primary-foreground" />
            </div>
            <span>Partner Metrics</span>
          </div>
          <p>Built with care for daily use.</p>
        </div>
      </footer>
    </div>
  );
}
