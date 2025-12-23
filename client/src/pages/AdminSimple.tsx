import { useState, useEffect } from "react";
import {
  Activity,
  Users,
  Building2,
  AlertCircle,
  TrendingUp,
  LogOut,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { hospitalAPI, analyticsAPI, patientAPI } from "@/services/api";
import { wsService } from "@/services/websocket";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AdminPanelSimple() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();

    // WebSocket listeners
    wsService.on('patient-created', handlePatientCreated);
    wsService.on('patient-updated', handlePatientUpdated);

    return () => {
      wsService.off('patient-created', handlePatientCreated);
      wsService.off('patient-updated', handlePatientUpdated);
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const hospitalId = user?.hospitalId || '1';

      const [patientsRes, analyticsRes] = await Promise.all([
        patientAPI.getPatients({ hospitalId }).catch(err => {
          console.error('Failed to load patients:', err);
          return { data: { patients: [] } };
        }),
        analyticsAPI.getOverview(hospitalId).catch(err => {
          console.error('Failed to load analytics:', err);
          return { data: {} };
        })
      ]);

      setPatients(patientsRes.data.patients || []);
      setAnalytics(analyticsRes.data);
    } catch (error: any) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientCreated = (patient: any) => {
    setPatients(prev => [patient, ...prev]);
    toast.info('New patient registered');
    loadData();
  };

  const handlePatientUpdated = (updatedPatient: any) => {
    setPatients(prev => prev.map(p => 
      p.id === updatedPatient.id ? updatedPatient : p
    ));
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleRefresh = () => {
    loadData();
    toast.success('Dashboard refreshed');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const totalPatients = patients.length;
  const criticalPatients = patients.filter(p => p.triageLevel === 'RED').length;
  const waitingPatients = patients.filter(p => p.status === 'waiting').length;
  const inTreatment = patients.filter(p => p.status === 'in-treatment').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPatients}</div>
              <p className="text-xs text-muted-foreground">Active in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{criticalPatients}</div>
              <p className="text-xs text-muted-foreground">Priority: RED</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Waiting</CardTitle>
              <Activity className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{waitingPatients}</div>
              <p className="text-xs text-muted-foreground">In queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Treatment</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inTreatment}</div>
              <p className="text-xs text-muted-foreground">Being treated</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Patients */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
            <CardDescription>Latest patient arrivals and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patients.slice(0, 15).map((patient: any) => (
                <div key={patient.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Age {patient.age} • {patient.gender} • {patient.status}
                      {patient.recommendedSpecialty && ` • ${patient.recommendedSpecialty}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      patient.triageLevel === 'RED' ? 'destructive' :
                      patient.triageLevel === 'YELLOW' ? 'default' :
                      'secondary'
                    }>
                      {patient.triageLevel}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(patient.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {patients.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No patients yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
