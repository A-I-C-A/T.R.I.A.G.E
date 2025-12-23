import { Toaster } from "@/components/ui/sonner";
import { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
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

function RouteSyncer() {
  const location = useLocation();
  
  useEffect(() => {
    document.title = `TriageLock - ${location.pathname.split('/')[1] || 'Home'}`;
  }, [location.pathname]);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
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
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);