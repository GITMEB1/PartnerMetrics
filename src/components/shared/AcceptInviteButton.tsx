"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitation } from "@/server/actions/household";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";

export function AcceptInviteButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleAccept() {
    setLoading(true);
    setError("");
    const result = await acceptInvitation(token);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/app/today");
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <Button
        onClick={handleAccept}
        className="w-full"
        size="lg"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Check className="mr-2 h-4 w-4" />
        )}
        Join household
      </Button>
    </div>
  );
}
