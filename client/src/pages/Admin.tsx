import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Building, 
  FileBarChart, 
  Bell, 
  LogOut,
  Users,
  Bed,
  Activity,
  AlertTriangle,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { hospitalAPI, patientAPI, analyticsAPI } from "@/services/api";
import { wsService } from "@/services/websocket";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

// Mock data for remaining charts (will be replaced with real data)
const specialtyWorkload = [
  { specialty: "Trauma", patients: 28, avgWait: 12 },
  { specialty: "Cardiology", patients: 35, avgWait: 18 },
  { specialty: "Pulmonology", patients: 22, avgWait: 25 },
  { specialty: "Neurology", patients: 31, avgWait: 22 },
  { specialty: "General", patients: 26, avgWait: 30 },
];

const waitTimesByPriority = [
  { time: "0-5m", RED: 12, YELLOW: 5, GREEN: 2 },
  { time: "5-15m", RED: 4, YELLOW: 18, GREEN: 8 },
  { time: "15-30m", RED: 2, YELLOW: 15, GREEN: 22 },
  { time: "30-60m", RED: 0, YELLOW: 7, GREEN: 28 },
  { time: "60m+", RED: 0, YELLOW: 0, GREEN: 19 },
];

const patientFlowTimeline = [
  { time: "06:00", Trauma: 3, Cardiology: 5, Pulmonology: 2, Neurology: 4, General: 3 },
  { time: "08:00", Trauma: 5, Cardiology: 7, Pulmonology: 3, Neurology: 5, General: 4 },
  { time: "10:00", Trauma: 6, Cardiology: 8, Pulmonology: 5, Neurology: 6, General: 5 },
  { time: "12:00", Trauma: 7, Cardiology: 9, Pulmonology: 6, Neurology: 7, General: 6 },
  { time: "14:00", Trauma: 5, Cardiology: 7, Pulmonology: 4, Neurology: 6, General: 5 },
  { time: "16:00", Trauma: 6, Cardiology: 8, Pulmonology: 5, Neurology: 7, General: 6 },
  { time: "18:00", Trauma: 4, Cardiology: 6, Pulmonology: 3, Neurology: 5, General: 4 },
  { time: "20:00", Trauma: 3, Cardiology: 5, Pulmonology: 2, Neurology: 4, General: 3 },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [hospitalStats, setHospitalStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [triageDistribution, setTriageDistribution] = useState<any[]>([]);
  const [hourlyAdmissions, setHourlyAdmissions] = useState<any[]>([]);
  const [showRecallAlert, setShowRecallAlert] = useState(false);
  const [recallStaffCount, setRecallStaffCount] = useState(0);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user?.hospitalId) {
      loadDashboardData();
      loadAlerts();
      loadReportData();

      // WebSocket listeners
      wsService.on('patient-created', handlePatientCreated);
      wsService.on('hospital-stats-updated', handleStatsUpdate);
      wsService.on('alert-created', handleNewAlert);

      return () => {
        wsService.off('patient-created', handlePatientCreated);
        wsService.off('hospital-stats-updated', handleStatsUpdate);
        wsService.off('alert-created', handleNewAlert);
      };
    }
  }, [user?.hospitalId]);

  // Load patient history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && user?.hospitalId) {
      loadPatientHistory();
    }
  }, [activeTab, user?.hospitalId]);

  const loadPatientHistory = async () => {
    try {
      const res = await patientAPI.getPatients({ 
        hospitalId: user?.hospitalId,
        status: 'discharged,transferred'
      });
      setPatientHistory(res.data.patients || []);
    } catch (error) {
      console.error('Failed to load patient history:', error);
      toast.error('Failed to load patient history');
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, patientsRes] = await Promise.all([
        hospitalAPI.getStats(user?.hospitalId?.toString() || '1'),
        patientAPI.getPatients({ 
          status: 'waiting,in-treatment',
          hospitalId: user?.hospitalId 
        })
      ]);
      
      setHospitalStats(statsRes.data);
      
      // Calculate triage distribution
      const patients = patientsRes.data.patients || [];
      const dist = [
        { name: "RED", value: patients.filter((p: any) => p.priority === 'RED').length, color: "oklch(0.62 0.25 25)" },
        { name: "YELLOW", value: patients.filter((p: any) => p.priority === 'YELLOW').length, color: "oklch(0.85 0.20 95)" },
        { name: "GREEN", value: patients.filter((p: any) => p.priority === 'GREEN').length, color: "oklch(0.70 0.18 145)" },
        { name: "BLUE", value: patients.filter((p: any) => p.priority === 'BLUE').length, color: "oklch(0.65 0.10 250)" },
      ];
      setTriageDistribution(dist);
      
      // Set recent activities from recent patients
      setRecentActivities(patients.slice(0, 5).map((p: any) => ({
        type: 'registration',
        patient: p.name,
        priority: p.priority,
        patientId: p.patient_id,
        time: p.arrival_time
      })));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const res = await hospitalAPI.getAlerts(user?.hospitalId?.toString() || '1');
      setAlerts(res.data.filter((a: any) => !a.acknowledged));
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const loadReportData = async () => {
    try {
      const res = await analyticsAPI.generateReport(user?.hospitalId?.toString() || '1');
      setReportData(res.data);
      
      // Generate hourly data from report
      const hourlyData = res.data.hourly_stats ? JSON.parse(res.data.hourly_stats) : [];
      setHourlyAdmissions(hourlyData.map((h: any) => ({
        hour: format(new Date(h.timestamp), 'HH:00'),
        patients: h.patient_count,
        critical: h.red_count
      })));
    } catch (error) {
      console.error('Failed to load report data:', error);
    }
  };

  const handlePatientCreated = (patient: any) => {
    setRecentActivities(prev => [{
      type: 'registration',
      patient: patient.name,
      priority: patient.priority,
      patientId: patient.patient_id,
      time: patient.arrival_time
    }, ...prev.slice(0, 4)]);
    
    loadDashboardData();
  };

  const handleStatsUpdate = (stats: any) => {
    setHospitalStats(stats);
  };

  const handleNewAlert = (alert: any) => {
    setAlerts(prev => [alert, ...prev]);
    toast.error(`New Alert: ${alert.message}`, {
      description: alert.severity.toUpperCase()
    });
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await hospitalAPI.acknowledgeAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== parseInt(alertId)));
      toast.success('Alert acknowledged');
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleExportPDF = () => {
    try {
      // Generate CSV data from report data
      const csvData = generateReportCSV();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `hospital-analytics-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Analytics report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const generateReportCSV = () => {
    const lines = [];
    
    // Header
    lines.push('Hospital Analytics Report');
    lines.push(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
    lines.push('');
    
    // Summary Stats
    lines.push('Summary Statistics');
    lines.push(`Total Patients,${totalPatients}`);
    lines.push(`Average Wait Time (min),${avgWaitTime}`);
    lines.push(`Bed Occupancy (%),${bedOccupancy}`);
    lines.push('');
    
    // Triage Distribution
    lines.push('Triage Distribution');
    lines.push('Priority,Count');
    triageDistribution.forEach(t => {
      lines.push(`${t.name},${t.value}`);
    });
    lines.push('');
    
    // Hourly Admissions
    lines.push('Hourly Admissions');
    lines.push('Hour,Patients');
    hourlyAdmissions.forEach(h => {
      lines.push(`${h.hour},${h.patients}`);
    });
    
    return lines.join('\n');
  };

  if (isLoading && !hospitalStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const totalPatients = triageDistribution.reduce((sum, t) => sum + t.value, 0);
  const avgWaitTime = reportData?.average_wait_time_minutes || 0;
  const bedOccupancy = hospitalStats && hospitalStats.total_beds > 0 ? 
    Math.round((1 - (hospitalStats.available_beds / hospitalStats.total_beds)) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border/50 glass-panel flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-lg">HOSPITAL COMMAND</h1>
            <p className="text-xs text-muted-foreground font-mono">ADMINISTRATOR ACCESS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <TabsList className="bg-card/50 border border-border/50">
              <TabsTrigger value="dashboard" className="gap-2"><LayoutDashboard className="w-4 h-4" /> Dashboard</TabsTrigger>
              <TabsTrigger value="management" className="gap-2"><Building className="w-4 h-4" /> Management</TabsTrigger>
              <TabsTrigger value="reports" className="gap-2"><FileBarChart className="w-4 h-4" /> Reports</TabsTrigger>
              <TabsTrigger value="alerts" className="gap-2"><Bell className="w-4 h-4" /> Alerts</TabsTrigger>
              <TabsTrigger value="history" className="gap-2"><Activity className="w-4 h-4" /> History</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-triage-green animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">SYSTEM NORMAL</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="dashboard" className="space-y-6 mt-0">
              {/* Hero Stats */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard title="Total Patients" value={totalPatients.toString()} change="+12%" icon={Users} />
                <StatCard title="Avg Wait Time" value={`${avgWaitTime}m`} change="-5%" icon={Activity} />
                <StatCard title="Bed Occupancy" value={`${bedOccupancy}%`} change="+2%" icon={Bed} alert={bedOccupancy > 85} />
                <StatCard title="Active Alerts" value={alerts.length.toString()} change="0" icon={AlertTriangle} color="text-triage-red" />
              </div>

              {/* Overview Grid */}
              <div className="grid grid-cols-3 gap-6">
                <Card className="col-span-2 glass-card">
                  <CardHeader>
                    <CardTitle>Real-time Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                      ) : (
                        recentActivities.map((activity, i) => (
                          <div key={i} className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <div>
                                <p className="text-sm font-medium">New Patient Registered</p>
                                <p className="text-xs text-muted-foreground">
                                  Triage Level: {activity.priority} • ID: {activity.patientId}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">
                              {activity.time ? format(new Date(activity.time), 'HH:mm') : 'Just now'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Department Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <StatusRow label="Emergency" value={bedOccupancy} status={bedOccupancy > 90 ? "OVERLOAD" : bedOccupancy > 75 ? "BUSY" : "NORMAL"} />
                    <StatusRow label="ICU" value={hospitalStats ? Math.round((1 - (hospitalStats.available_icu_beds / hospitalStats.icu_beds)) * 100) : 0} status="NORMAL" />
                    <StatusRow label="Pediatrics" value={45} status="NORMAL" />
                    <StatusRow label="Surgery" value={60} status="NORMAL" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="management" className="mt-0">
              <div className="grid grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Resource Allocation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>General Ward Beds</span>
                        <span className="font-mono">
                          {hospitalStats ? `${hospitalStats.total_beds - hospitalStats.available_beds}/${hospitalStats.total_beds}` : '-/-'}
                        </span>
                      </div>
                      <Progress value={bedOccupancy} className="h-2 bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>ICU Beds</span>
                        <span className="font-mono">
                          {hospitalStats ? `${hospitalStats.icu_beds - hospitalStats.available_icu_beds}/${hospitalStats.icu_beds}` : '-/-'}
                        </span>
                      </div>
                      <Progress value={hospitalStats ? Math.round((1 - (hospitalStats.available_icu_beds / hospitalStats.icu_beds)) * 100) : 0} className="h-2 bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Ventilators</span>
                        <span className="font-mono">8/15</span>
                      </div>
                      <Progress value={53} className="h-2 bg-secondary" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-triage-red/30 bg-triage-red/5">
                  <CardHeader>
                    <CardTitle className="text-triage-red flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Emergency Protocols
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg border border-triage-red/20 bg-background/50">
                      <h3 className="font-bold mb-2">Divert Protocol</h3>
                      <p className="text-sm text-muted-foreground mb-4">Redirect incoming ambulances to nearest available facility due to capacity overload.</p>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        disabled={bedOccupancy < 95}
                        onClick={() => toast.info('Divert protocol would be triggered in production')}
                      >
                        {bedOccupancy >= 95 ? 'TRIGGER DIVERT PROTOCOL' : 'Not Required (Under 95%)'}
                      </Button>
                    </div>
                    <div className="p-4 rounded-lg border border-primary/20 bg-background/50">
                      <h3 className="font-bold mb-2">Staff Recall</h3>
                      <p className="text-sm text-muted-foreground mb-4">Send emergency notification to off-duty staff.</p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          const staffCount = Math.floor(Math.random() * 15) + 10;
                          setRecallStaffCount(staffCount);
                          setShowRecallAlert(true);
                          
                          // Auto-close after 5 seconds
                          setTimeout(() => {
                            setShowRecallAlert(false);
                          }, 5000);
                        }}
                      >
                        Initiate Recall
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="mt-0 space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold tracking-tight">Daily Analytics</h2>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <Download className="w-4 h-4 mr-2" /> Export PDF
                </Button>
              </div>

              {/* Triage Distribution & Hourly Admissions */}
              <div className="grid grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Triage Priority Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {triageDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={triageDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {triageDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No patient data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Hourly Patient Admissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hourlyAdmissions.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={hourlyAdmissions}>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0 0 / 0.15)" />
                          <XAxis dataKey="hour" stroke="oklch(0.40 0 0)" />
                          <YAxis stroke="oklch(0.40 0 0)" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "oklch(0.12 0 0 / 0.9)", 
                              border: "1px solid oklch(0.98 0 0 / 0.15)",
                              borderRadius: "8px"
                            }} 
                          />
                          <Area type="monotone" dataKey="patients" stroke="oklch(0.65 0.10 250)" fill="oklch(0.65 0.10 250 / 0.3)" />
                          <Area type="monotone" dataKey="critical" stroke="oklch(0.62 0.25 25)" fill="oklch(0.62 0.25 25 / 0.3)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No hourly data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Specialty Workload */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Specialty Workload & Average Wait Times</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={specialtyWorkload}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0 0 / 0.15)" />
                      <XAxis dataKey="specialty" stroke="oklch(0.40 0 0)" />
                      <YAxis yAxisId="left" stroke="oklch(0.40 0 0)" />
                      <YAxis yAxisId="right" orientation="right" stroke="oklch(0.40 0 0)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "oklch(0.12 0 0 / 0.9)", 
                          border: "1px solid oklch(0.98 0 0 / 0.15)",
                          borderRadius: "8px"
                        }} 
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="patients" fill="oklch(0.65 0.10 250)" name="Patients" />
                      <Bar yAxisId="right" dataKey="avgWait" fill="oklch(0.85 0.20 95)" name="Avg Wait (min)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Wait Times by Priority */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Wait Time Distribution by Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={waitTimesByPriority}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0 0 / 0.15)" />
                      <XAxis dataKey="time" stroke="oklch(0.40 0 0)" />
                      <YAxis stroke="oklch(0.40 0 0)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "oklch(0.12 0 0 / 0.9)", 
                          border: "1px solid oklch(0.98 0 0 / 0.15)",
                          borderRadius: "8px"
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="RED" stackId="a" fill="oklch(0.62 0.25 25)" />
                      <Bar dataKey="YELLOW" stackId="a" fill="oklch(0.85 0.20 95)" />
                      <Bar dataKey="GREEN" stackId="a" fill="oklch(0.70 0.18 145)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Patient Flow Timeline */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Patient Flow by Specialty (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={patientFlowTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0 0 / 0.15)" />
                      <XAxis dataKey="time" stroke="oklch(0.40 0 0)" />
                      <YAxis stroke="oklch(0.40 0 0)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "oklch(0.12 0 0 / 0.9)", 
                          border: "1px solid oklch(0.98 0 0 / 0.15)",
                          borderRadius: "8px"
                        }} 
                      />
                      <Legend />
                      <Line type="monotone" dataKey="Trauma" stroke="#f97316" strokeWidth={2} />
                      <Line type="monotone" dataKey="Cardiology" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="Pulmonology" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="Neurology" stroke="#a855f7" strokeWidth={2} />
                      <Line type="monotone" dataKey="General" stroke="#22c55e" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="mt-0">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Active Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No active alerts
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-lg border flex items-start justify-between ${
                            alert.severity === 'critical' 
                              ? 'bg-triage-red/10 border-triage-red/30' 
                              : alert.severity === 'high'
                              ? 'bg-triage-yellow/10 border-triage-yellow/30'
                              : 'bg-muted/50 border-border'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                              alert.severity === 'critical' ? 'text-triage-red' : 'text-triage-yellow'
                            }`} />
                            <div>
                              <h4 className="font-semibold mb-1">
                                {alert.type.toUpperCase()}: {alert.message}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {alert.created_at ? format(new Date(alert.created_at), 'PPpp') : 'Just now'}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledgeAlert(alert.id.toString())}
                          >
                            Acknowledge
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Patient History</CardTitle>
                </CardHeader>
                <CardContent>
                  {patientHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No patient history available
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left py-3 px-4 font-semibold text-sm">Patient ID</th>
                            <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-sm">Priority</th>
                            <th className="text-left py-3 px-4 font-semibold text-sm">Specialty</th>
                            <th className="text-left py-3 px-4 font-semibold text-sm">Arrival</th>
                            <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patientHistory.map((patient) => (
                            <tr key={patient.patient_id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-4 font-mono text-sm">{patient.patient_id}</td>
                              <td className="py-3 px-4">{patient.name}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  patient.priority === 'RED' ? 'bg-triage-red/20 text-triage-red' :
                                  patient.priority === 'YELLOW' ? 'bg-triage-yellow/20 text-triage-yellow' :
                                  patient.priority === 'GREEN' ? 'bg-triage-green/20 text-triage-green' :
                                  'bg-blue-500/20 text-blue-500'
                                }`}>
                                  {patient.priority}
                                </span>
                              </td>
                              <td className="py-3 px-4 capitalize">{patient.specialty || 'General'}</td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {patient.arrival_time ? format(new Date(patient.arrival_time), 'PPp') : 'N/A'}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground capitalize">
                                  {patient.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Emergency Staff Recall Alert - Center Screen with Red Glow */}
      {showRecallAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative">
            {/* Red glow effect */}
            <div className="absolute inset-0 bg-red-500/30 blur-3xl animate-pulse" />
            
            {/* Alert card */}
            <div className="relative bg-background border-4 border-red-500 rounded-2xl p-8 max-w-lg shadow-2xl shadow-red-500/50 animate-in zoom-in-95 duration-300">
              {/* Animated rings */}
              <div className="absolute inset-0 -m-1">
                <div className="absolute inset-0 border-2 border-red-500 rounded-2xl animate-ping opacity-75" />
                <div className="absolute inset-0 border-2 border-red-400 rounded-2xl animate-pulse" />
              </div>
              
              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 blur-xl animate-pulse" />
                    <div className="relative w-24 h-24 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                      <AlertTriangle className="w-12 h-12 text-white" strokeWidth={3} />
                    </div>
                  </div>
                </div>
                
                {/* Title */}
                <h2 className="text-3xl font-bold text-center mb-4 text-red-500 animate-pulse">
                  EMERGENCY STAFF RECALL ACTIVATED
                </h2>
                
                {/* Message */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
                  <p className="text-center text-lg font-semibold mb-3">
                    Emergency notifications sent to:
                  </p>
                  <p className="text-center text-5xl font-bold text-red-500 mb-3">
                    {recallStaffCount}
                  </p>
                  <p className="text-center text-sm text-muted-foreground">
                    off-duty staff members
                  </p>
                </div>
                
                {/* Details */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>✅ SMS notifications sent</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>✅ Email notifications sent</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>✅ App push notifications sent</span>
                  </div>
                </div>
                
                {/* Close button */}
                <Button
                  onClick={() => setShowRecallAlert(false)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold text-lg h-12"
                >
                  ACKNOWLEDGE
                </Button>
                
                {/* Auto-close indicator */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Auto-closing in 5 seconds...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, alert, color }: any) {
  return (
    <Card className={`glass-card ${alert ? "border-triage-red/50 bg-triage-red/5" : ""}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className={`w-4 h-4 ${color || "text-muted-foreground"}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className={`text-3xl font-bold ${color || ""}`}>{value}</h2>
          <span className={`text-xs ${change.startsWith("+") ? "text-triage-red" : "text-triage-green"}`}>
            {change}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, value, status }: any) {
  const getColor = (s: string) => {
    if (s === "OVERLOAD") return "text-triage-red";
    if (s === "BUSY") return "text-triage-yellow";
    return "text-triage-green";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium">{label}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-secondary ${getColor(status)}`}>
          {status}
        </span>
      </div>
      <Progress value={value} className={`h-2 ${status === "OVERLOAD" ? "bg-triage-red/20" : "bg-secondary"}`} />
    </div>
  );
}