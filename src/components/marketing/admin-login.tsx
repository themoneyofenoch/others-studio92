"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, Shield, Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AdminLogin({ onCancel }: { onCancel?: () => void }) {
  const [email, setEmail] = useState("admin@studio92braids.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email, password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Invalid credentials. Try again.");
    } else {
      toast.success("Welcome back, admin.");
      // Force a reload to refresh session state in parent
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin access</h1>
          <p className="text-sm text-muted-foreground mt-2">
            The marketing dashboard is restricted to Studio 92 staff. Sign in to continue.
          </p>
        </div>

        <form onSubmit={submit} className="p-7 rounded-2xl borderless-card bg-card space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10 rounded-xl h-11"
                placeholder="admin@studio92braids.com"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 rounded-xl h-11"
                placeholder="••••••••"
                required
                autoFocus
              />
            </div>
          </div>
          <Button type="submit" className="w-full rounded-full h-11 mt-2" disabled={loading}>
            {loading
              ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Signing in…</>
              : <>Sign in <ArrowRight className="w-4 h-4 ml-1.5" /></>
            }
          </Button>

          <div className="pt-3 mt-2 border-t border-border/40 text-center">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <Shield className="w-3 h-3 inline mr-1" />
              Demo credentials: <code className="font-mono text-foreground/70">admin@studio92braids.com</code> / <code className="font-mono text-foreground/70">studio92</code>
            </p>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
          >
            <Megaphone className="w-3.5 h-3.5" /> Back to studio site
          </button>
        </div>
      </motion.div>
    </div>
  );
}
