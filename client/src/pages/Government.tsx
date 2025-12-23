import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Map, 
  TrendingUp, 
  AlertOctagon, 
  LogOut,
  Download,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { hospitalAPI, analyticsAPI } from "@/services/api";
import { wsService } from "@/services/websocket";
import { toast } from "sonner";

export default function GovernmentView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hoveredHospital, setHoveredHospital] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGovernmentData();

    // WebSocket for real-time updates
    wsService.on('hospital-stats-updated', handleHospitalUpdate);

    return () => {
      wsService.off('hospital-stats-updated', handleHospitalUpdate);
    };
  }, []);

  const loadGovernmentData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch hospitals
      const hospitalsRes = await hospitalAPI.getHospitals();
      const hospitalList = hospitalsRes.data;
      
      // Try to fetch dashboard data, but don't fail if it errors
      let dashboardRes = null;
      try {
        dashboardRes = await analyticsAPI.getGovernmentDashboard();
      } catch (dashError) {
        console.warn('Government dashboard API not available:', dashError);
        // Continue without dashboard data
      }
      
      // Calculate occupancy and status for each hospital
      const enrichedHospitals = hospitalList.map((h: any, index: number) => {
        const occupancy = h.total_beds > 0 
          ? Math.round(((h.total_beds - h.available_beds) / h.total_beds) * 100)
          : 0;
        
        const status = occupancy >= 90 ? 'CRITICAL' 
          : occupancy >= 75 ? 'BUSY' 
          : 'NORMAL';
        
        // Position hospitals on map (simplified grid distribution)
        const positions = [
          { x: 25, y: 30 },
          { x: 65, y: 25 },
          { x: 50, y: 70 },
          { x: 20, y: 65 },
          { x: 75, y: 60 }
        ];
        
        return {
          ...h,
          occupancy,
          status,
          wait: '0h 30m', // Would come from analytics
          surge: occupancy >= 90,
          x: positions[index % positions.length].x,
          y: positions[index % positions.length].y
        };
      });

      setHospitals(enrichedHospitals);
      setDashboardData(dashboardRes?.data || null);
    } catch (error) {
      console.error('Failed to load government data:', error);
      toast.error('Failed to load dashboard data');
      // Set empty array to prevent infinite loading
      setHospitals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHospitalUpdate = (data: any) => {
    setHospitals(prev => prev.map(h => 
      h.id === data.hospitalId ? { ...h, ...data.stats } : h
    ));
  };

  const handleExportData = () => {
    try {
      const csvData = generateGovernmentCSV();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.setAttribute('href', url);
      link.setAttribute('download', `government-health-overview-${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Health overview exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const generateGovernmentCSV = () => {
    const lines = [];
    const now = new Date();
    
    // Header
    lines.push('Government Health Dashboard - Hospital Network Overview');
    lines.push(`Generated: ${now.toLocaleString()}`);
    lines.push('');
    
    // Summary
    if (dashboardData) {
      lines.push('Network Summary');
      lines.push(`Total Hospitals,${dashboardData.total_hospitals || hospitals.length}`);
      lines.push(`Total Patients,${dashboardData.total_patients || 0}`);
      lines.push(`Average Wait Time,${dashboardData.average_wait_time || 'N/A'}`);
      lines.push(`Critical Alerts,${dashboardData.critical_alerts || 0}`);
      lines.push('');
    }
    
    // Hospital Details
    lines.push('Hospital Metrics');
    lines.push('Hospital Name,Total Beds,Available Beds,Occupancy %,Waiting Patients,Status');
    hospitals.forEach(h => {
      lines.push(`${h.name},${h.total_beds},${h.available_beds},${h.occupancy}%,${h.waiting_patients || 0},${h.status}`);
    });
    
    return lines.join('\n');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading government dashboard...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CRITICAL": return "bg-triage-red";
      case "BUSY": return "bg-triage-yellow";
      case "NORMAL": return "bg-triage-green";
      default: return "bg-triage-blue";
    }
  };

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case "CRITICAL": return "border-triage-red";
      case "BUSY": return "border-triage-yellow";
      case "NORMAL": return "border-triage-green";
      default: return "border-triage-blue";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border/50 glass-panel flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-lg">CITY MONITOR</h1>
            <p className="text-xs text-muted-foreground font-mono">MUNICIPAL HEALTH DEPT</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
        {/* Top Section: Map & Stats */}
        <div className="grid grid-cols-3 gap-6 h-[400px]">
          {/* Interactive Map */}
          <Card className="col-span-2 glass-card overflow-hidden relative group">
            <div className="absolute inset-0 bg-secondary/30">
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-10 grid-rows-10 h-full w-full">
                  {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} className="border border-foreground/20" />
                  ))}
                </div>
              </div>

              {/* Hospital markers */}
              {hospitals.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground">No hospitals available</p>
                </div>
              ) : (
                hospitals.map((hospital, index) => (
                <motion.div
                  key={hospital.id || hospital.name || index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="absolute cursor-pointer z-10"
                  style={{ left: `${hospital.x || 50}%`, top: `${hospital.y || 50}%` }}
                  onMouseEnter={() => setHoveredHospital(hospital.name)}
                  onMouseLeave={() => setHoveredHospital(null)}
                >
                  {/* Pulsing ring - only for critical/busy */}
                  {hospital.status && (hospital.status === "CRITICAL" || hospital.status === "BUSY") && (
                    <motion.div
                      animate={{
                        scale: [1, 1.8, 1],
                        opacity: [0.6, 0, 0.6],
                      }}
                      transition={{
                        duration: hospital.status === "CRITICAL" ? 1.5 : 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className={`absolute -inset-4 rounded-full border-2 ${
                        hospital.status === "CRITICAL" 
                          ? "bg-triage-red/40 border-triage-red" 
                          : "bg-triage-yellow/40 border-triage-yellow"
                      }`}
                    />
                  )}
                  
                  {/* Pulsing ring for NORMAL status - gentle green pulse */}
                  {hospital.status === "NORMAL" && (
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.4, 0, 0.4],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute -inset-4 rounded-full bg-triage-green/30 border-2 border-triage-green"
                    />
                  )}
                  
                  {/* Marker */}
                  <div className={`relative w-4 h-4 rounded-full shadow-lg border-2 border-background hover:scale-150 transition-transform ${
                    hospital.status === "CRITICAL" ? "bg-triage-red shadow-triage-red/50" :
                    hospital.status === "BUSY" ? "bg-triage-yellow shadow-triage-yellow/50" :
                    "bg-triage-green shadow-triage-green/50"
                  }`}>
                    {hospital.surge && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-1"
                      >
                        <AlertOctagon className="w-6 h-6 text-triage-red" />
                      </motion.div>
                    )}
                  </div>

                  {/* Tooltip */}
                  {hoveredHospital === hospital.name && hospital.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap glass-card px-3 py-2 rounded-lg border ${getStatusBorderColor(hospital.status || 'NORMAL')} shadow-xl z-20`}
                    >
                      <div className="text-sm font-bold">{hospital.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {hospital.occupancy || 0}% occupancy • {hospital.wait || '-'} wait
                      </div>
                      <div className={`text-xs font-bold mt-1 ${
                        hospital.status === "CRITICAL" ? "text-triage-red" :
                        hospital.status === "BUSY" ? "text-triage-yellow" :
                        "text-triage-green"
                      }`}>
                        {hospital.status || 'NORMAL'}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))
              )}

              {/* Map Title Overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-2 glass-card px-3 py-2 rounded-lg border border-border/50">
                <Map className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-bold text-muted-foreground">LIVE CITY MAP</span>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 right-4 glass-card px-4 py-3 rounded-lg border border-border/50">
                <div className="text-xs font-mono font-bold mb-2 text-muted-foreground">STATUS</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-triage-red" />
                    <span className="text-xs">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-triage-yellow" />
                    <span className="text-xs">Busy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-triage-green" />
                    <span className="text-xs">Normal</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* City Stats */}
          <div className="flex flex-col gap-4">
            <Card className="glass-card flex-1">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">City Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold mb-2 ${
                  hospitals.some(h => h.status === 'CRITICAL') ? 'text-triage-red' :
                  hospitals.some(h => h.status === 'BUSY') ? 'text-triage-yellow' :
                  'text-triage-green'
                }`}>
                  {hospitals.some(h => h.status === 'CRITICAL') ? 'CRITICAL' :
                   hospitals.some(h => h.status === 'BUSY') ? 'ELEVATED' :
                   'NORMAL'}
                </div>
                <p className="text-sm text-muted-foreground">
                  {hospitals.filter(h => h.status === 'CRITICAL').length > 0 
                    ? `${hospitals.filter(h => h.status === 'CRITICAL').length} hospital(s) at critical capacity`
                    : hospitals.filter(h => h.status === 'BUSY').length > 0
                    ? `${hospitals.filter(h => h.status === 'BUSY').length} hospital(s) experiencing high load`
                    : 'All hospitals operating normally'}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card flex-1">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Total Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">
                  {hospitals.length > 0 
                    ? Math.round(hospitals.reduce((sum, h) => sum + h.occupancy, 0) / hospitals.length)
                    : 0}%
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all" 
                    style={{ 
                      width: `${hospitals.length > 0 
                        ? Math.round(hospitals.reduce((sum, h) => sum + h.occupancy, 0) / hospitals.length)
                        : 0}%` 
                    }} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section: Hospital List & Surge Detection */}
        <div className="grid grid-cols-3 gap-6 flex-1">
          <Card className="col-span-2 glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Hospital Metrics</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
                <Button variant="outline" size="sm" onClick={handleExportData}><Download className="w-4 h-4 mr-2" /> Export</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead>Avg Wait</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitals && hospitals.length > 0 ? (
                    hospitals.map((h) => (
                      <TableRow 
                        key={h.id || h.name} 
                        className="cursor-pointer hover:bg-secondary/50"
                        onMouseEnter={() => setHoveredHospital(h.name)}
                        onMouseLeave={() => setHoveredHospital(null)}
                      >
                        <TableCell className="font-medium">{h.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            h.status === "CRITICAL" ? "bg-triage-red/20 text-triage-red" :
                            h.status === "BUSY" ? "bg-triage-yellow/20 text-triage-yellow" :
                            "bg-triage-green/20 text-triage-green"
                          }`}>
                            {h.status || 'NORMAL'}
                          </span>
                        </TableCell>
                        <TableCell>{h.occupancy || 0}%</TableCell>
                        <TableCell className="font-mono">{h.wait || '-'}</TableCell>
                        <TableCell>
                          {h.surge ? (
                            <TrendingUp className="w-4 h-4 text-triage-red" />
                          ) : (
                            <div className="w-4 h-1 bg-secondary rounded-full" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No hospitals available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="glass-card border-triage-red/30 bg-triage-red/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-triage-red">
                <AlertOctagon className="w-5 h-5" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.activeAlerts && dashboardData.activeAlerts.length > 0 ? (
                  dashboardData.activeAlerts.slice(0, 3).map((alert: any) => (
                    <div key={alert.id} className="p-4 bg-background/50 rounded-lg border border-triage-red/20">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold">{alert.hospital_name}</h3>
                        <span className={`text-xs font-mono ${
                          alert.severity === 'critical' ? 'text-triage-red animate-pulse' : 'text-triage-yellow'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {alert.message}
                      </p>
                      <div className="text-xs font-mono text-muted-foreground">
                        {alert.type.toUpperCase()} • {alert.hospital_location}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No active alerts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}