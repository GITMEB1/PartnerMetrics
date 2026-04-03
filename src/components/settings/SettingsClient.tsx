"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/server/actions/auth";
import { createInvitation, updateHousehold } from "@/server/actions/household";
import type { Profile } from "@/types/db";
import {
  Settings, User, Home, Users, Mail, LogOut, Check, Copy, Loader2, Send,
} from "lucide-react";

type SettingsClientProps = {
  profile: Profile | null;
  household: { id: string; name: string } | null;
  members: { userId: string; displayName: string; role: string }[];
  invitations: { id: string; email: string; status: string; created_at: string }[];
  isOwner: boolean;
  userEmail: string;
};

export function SettingsClient({
  profile,
  household,
  members,
  invitations,
  isOwner,
  userEmail,
}: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [householdName, setHouseholdName] = useState(household?.name || "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  function handleUpdateHousehold() {
    startTransition(async () => {
      setError("");
      const formData = new FormData();
      formData.set("name", householdName);
      const result = await updateHousehold(formData);
      if (result.error) setError(result.error);
      else setSuccess("Household name updated");
    });
  }

  function handleInvite() {
    startTransition(async () => {
      setError("");
      setInviteUrl("");
      const formData = new FormData();
      formData.set("email", inviteEmail);
      const result = await createInvitation(formData);
      if (result.error) setError(result.error);
      else if (result.data?.inviteUrl) {
        setInviteUrl(result.data.inviteUrl as string);
        setInviteEmail("");
        setSuccess("Invitation sent!");
      }
    });
  }

  async function copyInviteUrl() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Settings</h1>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Display name</Label>
            <p className="text-sm font-medium">{profile?.display_name}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <p className="text-sm font-medium">{userEmail}</p>
          </div>
        </CardContent>
      </Card>

      {/* Household */}
      {household && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4" />
              Household
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isOwner ? (
              <div className="space-y-2">
                <Label htmlFor="household-name">Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="household-name"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={handleUpdateHousehold}
                    disabled={isPending || householdName === household.name}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="text-sm font-medium">{household.name}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {m.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{m.displayName}</span>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {m.role}
              </Badge>
            </div>
          ))}

          {/* Pending invitations */}
          {invitations.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm text-muted-foreground">{inv.email}</span>
              </div>
              <Badge variant="warning" className="text-[10px]">
                pending
              </Badge>
            </div>
          ))}

          {/* Invite */}
          {isOwner && members.length < 2 && invitations.length === 0 && (
            <div className="pt-3 border-t space-y-2">
              <Label className="text-xs">Invite partner</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="partner@email.com"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={handleInvite}
                  disabled={isPending || !inviteEmail}
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Invite
                </Button>
              </div>
            </div>
          )}

          {/* Invite URL */}
          {inviteUrl && (
            <div className="pt-3 border-t space-y-2">
              <Label className="text-xs">Share this invite link</Label>
              <div className="flex gap-2">
                <Input value={inviteUrl} readOnly className="text-xs" />
                <Button size="sm" variant="outline" onClick={copyInviteUrl}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Messages */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-success bg-success/10 rounded-md px-3 py-2">
          {success}
        </p>
      )}

      {/* Sign Out */}
      <form action={signOut}>
        <Button variant="outline" className="w-full text-destructive hover:text-destructive" type="submit">
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </form>
    </div>
  );
}
