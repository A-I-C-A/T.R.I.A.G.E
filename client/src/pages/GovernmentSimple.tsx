import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, RefreshCw, TrendingUp, Users, Building2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { analyticsAPI, hospitalAPI, patientAPI } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function GovernmentView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<any>({});
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [analyticsRes, hospitalsRes, patientsRes] = await Promise.all([
        analyticsAPI.getOverview().catch(err => {
          console.error('Failed to load analytics:', err);
          return { data: {} };
        }),
        hospitalAPI.getHospitals().catch(err => {
          console.error('Failed to load hospitals:', err);
          return { data: { hospitals: [] } };
        }),
        patientAPI.getPatients({}).catch(err => {
          console.error('Failed to load patients:', err);
          return { data: { patients: [] } };
        })
      ]);

      setAnalytics(analyticsRes.data);
      setHospitals(hospitalsRes.data.hospitals || []);
      setAllPatients(patientsRes.data.patients || []);
    } catch (error: any) {
      console.error('Error loading government data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleRefresh = () => {
    loadData();
    toast.success('Data refreshed');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  const totalPatients = allPatients.length;
  const criticalPatients = allPatients.filter(p => p.triageLevel === 'RED').length;
  const yellowPatients = allPatients.filter(p => p.triageLevel === 'YELLOW').length;
  const greenPatients = allPatients.filter(p => p.triageLevel === 'GREEN').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Government Analytics</h1>
              <p className="text-sm text-muted-foreground">Healthcare Monitoring Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPatients}</div>
              <p className="text-xs text-muted-foreground">Across all hospitals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Critical (RED)</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{criticalPatients}</div>
              <p className="text-xs text-muted-foreground">Immediate attention needed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Urgent (YELLOW)</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{yellowPatients}</div>
              <p className="text-xs text-muted-foreground">Priority cases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Stable (GREEN)</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{greenPatients}</div>
              <p className="text-xs text-muted-foreground">Non-urgent</p>
            </CardContent>
          </Card>
        </div>

        {/* Hospital Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Hospital Status</CardTitle>
            <CardDescription>Real-time hospital capacity and load</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hospitals.length > 0 ? hospitals.map((hospital: any) => {
                const hospitalPatients = allPatients.filter(p => p.hospitalId === hospital.id);
                const capacity = hospital.capacity?.total || 100;
                const load = (hospitalPatients.length / capacity) * 100;

                return (
                  <div key={hospital.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">{hospital.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {hospital.address} • {hospitalPatients.length} patients
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        load > 80 ? 'destructive' :
                        load > 60 ? 'default' :
                        'secondary'
                      }>
                        {load.toFixed(0)}% Load
                      </Badge>
                      <div className="text-xs text-muted-foreground text-right">
                        <div>Capacity: {capacity}</div>
                        <div>Available: {capacity - hospitalPatients.length}</div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-center text-muted-foreground py-4">No hospitals registered</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Triage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Triage Distribution</CardTitle>
            <CardDescription>Patient breakdown by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 bg-red-500/10">
                <div className="text-3xl font-bold text-red-500">{criticalPatients}</div>
                <p className="text-sm text-muted-foreground mt-1">RED - Critical</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalPatients > 0 ? ((criticalPatients / totalPatients) * 100).toFixed(1) : 0}% of total
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-yellow-500/10">
                <div className="text-3xl font-bold text-yellow-600">{yellowPatients}</div>
                <p className="text-sm text-muted-foreground mt-1">YELLOW - Urgent</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalPatients > 0 ? ((yellowPatients / totalPatients) * 100).toFixed(1) : 0}% of total
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-green-500/10">
                <div className="text-3xl font-bold text-green-600">{greenPatients}</div>
                <p className="text-sm text-muted-foreground mt-1">GREEN - Stable</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalPatients > 0 ? ((greenPatients / totalPatients) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
