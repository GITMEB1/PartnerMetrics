import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users } from "lucide-react";
import { AcceptInviteButton } from "@/components/shared/AcceptInviteButton";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Fetch invitation
  const { data: invitation } = await supabase
    .from("invitations")
    .select("*, households(name), profiles!invitations_invited_by_fkey(display_name)")
    .eq("token", token)
    .single();

  if (!invitation || invitation.status !== "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is no longer valid. It may have expired or been revoked.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Invitation Expired</CardTitle>
            <CardDescription>
              This invitation has expired. Please ask to be invited again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is logged in
  if (!user) {
    redirect(`/signup?invite=${token}`);
  }

  const householdName = (invitation as Record<string, unknown>).households
    ? ((invitation as Record<string, unknown>).households as { name: string }).name
    : "Unknown";
  const inviterName = (invitation as Record<string, unknown>).profiles
    ? ((invitation as Record<string, unknown>).profiles as { display_name: string }).display_name
    : "Someone";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">Partner Metrics</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl">You&apos;re invited!</CardTitle>
            <CardDescription>
              <span className="font-medium text-foreground">{inviterName}</span>{" "}
              invited you to join{" "}
              <span className="font-medium text-foreground">{householdName}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AcceptInviteButton token={token} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
