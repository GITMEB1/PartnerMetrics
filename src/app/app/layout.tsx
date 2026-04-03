import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-shell/AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between px-4">
          <span className="font-semibold text-sm truncate">
            {profile?.display_name || "Partner Metrics"}
          </span>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
            {profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container px-4 py-4 pb-24 md:pb-6 max-w-2xl mx-auto">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <AppNav />
    </div>
  );
}
