"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      if (!response.ok) {
        setMessage("Could not sign out. Please try again.");
        return;
      }

      router.replace("/sign-in");
      router.refresh();
    } catch {
      setMessage("Could not sign out. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={signOut} disabled={pending}>
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {message && <p role="alert">{message}</p>}
    </div>
  );
}