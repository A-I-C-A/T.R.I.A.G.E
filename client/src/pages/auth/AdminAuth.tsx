import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, Shield, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function AdminAuth() {
  const { isLoading: authLoading, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/admin");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to login. Please check your credentials.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-triage-red/5 via-background to-background relative">
      {/* Animated Wavy Lines Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1920 1080"
        >
          {[...Array(25)].map((_, i) => {
            const startY = -300 + i * 70;
            const delay = i * 0.08;
            const duration = 12 + (i % 6) * 2;
            const randomOffset = (i % 3) * 100 - 100;
            const curveIntensity = 150 + (i % 4) * 50;
            
            return (
              <motion.path
                key={`line-${i}`}
                d={`M -600 ${startY} Q ${400 + randomOffset} ${startY + curveIntensity}, ${960 + randomOffset} ${startY + curveIntensity / 2} T 2500 ${startY + curveIntensity * 0.8}`}
                stroke="rgba(192, 192, 192, 0.4)"
                strokeWidth={i % 2 === 0 ? "2.5" : "2"}
                fill="none"
                initial={{ pathLength: 0, opacity: 0, x: -600 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: [0, 0.5, 0.5, 0.3],
                  x: [0, 600]
                }}
                transition={{
                  pathLength: { duration: 3, delay },
                  opacity: { duration: 4, delay, times: [0, 0.3, 0.7, 1] },
                  x: { duration, delay, repeat: Infinity, ease: "linear" }
                }}
              />
            );
          })}
          
          {[...Array(20)].map((_, i) => {
            const startY = 50 + i * 80;
            const delay = i * 0.12;
            const duration = 16 + (i % 5) * 3;
            const randomAngle = (i % 5) * 80 - 160;
            const waveHeight = 120 + (i % 3) * 60;
            
            return (
              <motion.path
                key={`accent-${i}`}
                d={`M -400 ${startY} Q ${700 + randomAngle} ${startY - waveHeight}, ${1300 + randomAngle} ${startY + waveHeight / 2} T 2600 ${startY + randomAngle / 2}`}
                stroke="rgba(192, 192, 192, 0.3)"
                strokeWidth="1.5"
                fill="none"
                initial={{ pathLength: 0, opacity: 0, x: -500 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: [0, 0.4, 0.4, 0.2],
                  x: [0, 700]
                }}
                transition={{
                  pathLength: { duration: 3.5, delay },
                  opacity: { duration: 5, delay, times: [0, 0.3, 0.7, 1] },
                  x: { duration, delay, repeat: Infinity, ease: "linear" }
                }}
              />
            );
          })}
        </svg>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-triage-red/10 rounded-lg">
              <Shield className="w-8 h-8 text-triage-red" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Portal</h1>
              <p className="text-sm text-muted-foreground font-mono">SYSTEM MANAGEMENT</p>
            </div>
          </div>

          <Card className="w-full max-w-lg pb-0 border shadow-md border-triage-red/20">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Administrator Access</CardTitle>
              <CardDescription>
                Enter your credentials to access the triage system
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Default Credentials:</p>
                  <p className="text-xs font-mono">admin@cityhospital.com / admin123</p>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="admin@cityhospital.com"
                    type="email"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="relative">
                  <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-triage-red hover:bg-triage-red/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </CardFooter>
            </form>

            <div className="py-4 px-6 text-xs text-center text-muted-foreground bg-muted border-t rounded-b-lg">
              <Button
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={() => navigate("/")}
              >
                ← Back to role selection
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
