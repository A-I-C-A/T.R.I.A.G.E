import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { ThemeProvider } from "@/hooks/use-theme";
import "./index.css";
import "./types/global.d.ts";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const NurseAuth = lazy(() => import("./pages/auth/NurseAuth.tsx"));
const DoctorAuth = lazy(() => import("./pages/auth/DoctorAuth.tsx"));
const AdminAuth = lazy(() => import("./pages/auth/AdminAuth.tsx"));
const GovernmentAuth = lazy(() => import("./pages/auth/GovernmentAuth.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const NurseView = lazy(() => import("./pages/Nurse.tsx"));
const DoctorView = lazy(() => import("./pages/Doctor.tsx"));
const AdminPanel = lazy(() => import("./pages/Admin.tsx"));
const GovernmentView = lazy(() => import("./pages/Government.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground font-mono tracking-tight">INITIALIZING TRIAGELOCK...</div>
    </div>
  );
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <ThemeProvider>
      <InstrumentationProvider>
        <ConvexAuthProvider client={convex}>
          <BrowserRouter>
            <RouteSyncer />
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<AuthPage redirectAfterAuth="/" />} />
                <Route path="/auth/nurse" element={<NurseAuth />} />
                <Route path="/auth/doctor" element={<DoctorAuth />} />
                <Route path="/auth/admin" element={<AdminAuth />} />
                <Route path="/auth/government" element={<GovernmentAuth />} />
                <Route path="/nurse" element={<NurseView />} />
                <Route path="/doctor" element={<DoctorView />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/government" element={<GovernmentView />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster />
        </ConvexAuthProvider>
      </InstrumentationProvider>
    </ThemeProvider>
  </StrictMode>,
);