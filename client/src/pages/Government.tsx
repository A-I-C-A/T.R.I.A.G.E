import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Map, 
  TrendingUp, 
  AlertOctagon, 
  LogOut,
  Download,
  Filter,
  Plus,
  Building,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { hospitalAPI, analyticsAPI } from "@/services/api";
import { wsService } from "@/services/websocket";
import { toast } from "sonner";
import { SurgeForecastPanel } from "@/components/doctor/SurgeForecastPanel";

export default function GovernmentView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hoveredHospital, setHoveredHospital] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedHospitalDetails, setSelectedHospitalDetails] = useState<any>(null);
  const [isHospitalDetailsOpen, setIsHospitalDetailsOpen] = useState(false);
  
  // Hospital registration form
  const [isAddHospitalOpen, setIsAddHospitalOpen] = useState(false);
  const [newHospital, setNewHospital] = useState({
    name: '',
    location: '',
    totalBeds: '',
    generalWardBeds: '',
    icuBeds: '',
    ventilators: '',
    emergencyDoctors: '',
    cardiologyDoctors: '',
    neurologyDoctors: '',
    orthopedicsDoctors: '',
    generalDoctors: '',
    nurses: '',
    emergencyNurses: ''
  });

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
        
        // Truly random positioning across the map
        // Use hospital ID as seed for consistent positions across refreshes
        const seed = h.id || index;
        const random1 = (Math.sin(seed * 12.9898) * 43758.5453) % 1;
        const random2 = (Math.cos(seed * 78.233) * 43758.5453) % 1;
        
        // Random position with margins (15% to 85% of map area)
        const x = 15 + (Math.abs(random1) * 70);
        const y = 15 + (Math.abs(random2) * 70);
        
        return {
          ...h,
          occupancy,
          status,
          wait: '0h 30m', // Would come from analytics
          surge: occupancy >= 90,
          x,
          y
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

  const handleAddHospital = async () => {
    try {
      // Validation
      if (!newHospital.name || !newHospital.location || !newHospital.totalBeds) {
        toast.error('Please fill all required fields (Name, Location, Total Beds)');
        return;
      }

      const totalBeds = parseInt(newHospital.totalBeds);
      const generalWardBeds = parseInt(newHospital.generalWardBeds) || 0;
      const icuBeds = parseInt(newHospital.icuBeds) || 0;

      // Validate bed counts
      if (generalWardBeds + icuBeds > totalBeds) {
        toast.error('General Ward + ICU beds cannot exceed Total Beds');
        return;
      }

      const response = await hospitalAPI.createHospital({
        name: newHospital.name,
        location: newHospital.location,
        total_beds: totalBeds,
        general_ward_beds: generalWardBeds,
        icu_beds: icuBeds,
        ventilators: parseInt(newHospital.ventilators) || 0,
        available_beds: totalBeds,
        available_icu_beds: icuBeds,
        staff: {
          doctors: {
            emergency: parseInt(newHospital.emergencyDoctors) || 0,
            cardiology: parseInt(newHospital.cardiologyDoctors) || 0,
            neurology: parseInt(newHospital.neurologyDoctors) || 0,
            orthopedics: parseInt(newHospital.orthopedicsDoctors) || 0,
            general: parseInt(newHospital.generalDoctors) || 0,
          },
          nurses: {
            total: parseInt(newHospital.nurses) || 0,
            emergency: parseInt(newHospital.emergencyNurses) || 0,
          }
        }
      });

      toast.success(`Hospital "${newHospital.name}" registered successfully!`);
      
      // Reset form
      setNewHospital({ 
        name: '', 
        location: '', 
        totalBeds: '', 
        generalWardBeds: '',
        icuBeds: '',
        ventilators: '',
        emergencyDoctors: '',
        cardiologyDoctors: '',
        neurologyDoctors: '',
        orthopedicsDoctors: '',
        generalDoctors: '',
        nurses: '',
        emergencyNurses: ''
      });
      setIsAddHospitalOpen(false);
      
      // Reload data
      loadGovernmentData();
    } catch (error: any) {
      console.error('Failed to register hospital:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to register hospital';
      toast.error(`Failed to register hospital: ${errorMessage}`);
    }
  };

  const handleUpdateHospitalBeds = async (hospitalId: number, field: 'beds' | 'icu', value: number) => {
    try {
      const hospital = hospitals.find(h => h.id === hospitalId);
      if (!hospital) return;

      const updateData = field === 'beds' 
        ? { available_beds: value, available_icu_beds: hospital.available_icu_beds }
        : { available_beds: hospital.available_beds, available_icu_beds: value };

      await hospitalAPI.updateBeds(hospitalId, updateData);
      
      toast.success('Hospital capacity updated');
      loadGovernmentData();
    } catch (error) {
      console.error('Failed to update hospital:', error);
      toast.error('Failed to update hospital capacity');
    }
  };

  const handleShowHospitalDetails = (hospital: any) => {
    setSelectedHospitalDetails(hospital);
    setIsHospitalDetailsOpen(true);
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-6 mt-4 w-fit">
          <TabsTrigger value="dashboard" className="gap-2">
            <Map className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="hospitals" className="gap-2">
            <Building className="w-4 h-4" />
            Hospital Management
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="flex-1 p-6 overflow-auto space-y-6">

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
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {h.name || 'Unknown'}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-primary/10"
                              onClick={() => handleShowHospitalDetails(h)}
                            >
                              <Info className="w-4 h-4 text-primary" />
                            </Button>
                          </div>
                        </TableCell>
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

          {/* AI Surge Forecast + Alerts */}
          <div className="space-y-4">
            {/* AI Surge Forecast Panel */}
            {hospitals && hospitals.length > 0 && (
              <SurgeForecastPanel hospitalId={hospitals[0].id} />
            )}

            {/* Active Alerts - Smaller */}
            <Card className="glass-card border-triage-red/30 bg-triage-red/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-triage-red text-sm">
                  <AlertOctagon className="w-4 h-4" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.activeAlerts && dashboardData.activeAlerts.length > 0 ? (
                    dashboardData.activeAlerts.slice(0, 2).map((alert: any) => (
                      <div key={alert.id} className="p-3 bg-background/50 rounded-lg border border-triage-red/20 text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-sm">{alert.hospital_name}</h3>
                          <span className={`text-xs font-mono ${
                            alert.severity === 'critical' ? 'text-triage-red animate-pulse' : 'text-triage-yellow'
                          }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {alert.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-xs">
                      No active alerts
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </TabsContent>

        {/* Hospital Management Tab */}
        <TabsContent value="hospitals" className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            {/* Header with Add Hospital Button */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Hospital Network Management</h2>
                <p className="text-muted-foreground">Register and manage hospitals in the city network</p>
              </div>
              <Dialog open={isAddHospitalOpen} onOpenChange={setIsAddHospitalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Register New Hospital
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Register New Hospital</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground">Basic Information</h3>
                      <div>
                        <Label htmlFor="hospital-name">Hospital Name *</Label>
                        <Input
                          id="hospital-name"
                          placeholder="e.g., Apollo Hospital"
                          value={newHospital.name}
                          onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hospital-location">Location *</Label>
                        <Input
                          id="hospital-location"
                          placeholder="e.g., Hyderabad, Telangana"
                          value={newHospital.location}
                          onChange={(e) => setNewHospital({ ...newHospital, location: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Bed Capacity */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground">Bed Capacity</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="total-beds">Total Beds *</Label>
                          <Input
                            id="total-beds"
                            type="number"
                            placeholder="500"
                            value={newHospital.totalBeds}
                            onChange={(e) => setNewHospital({ ...newHospital, totalBeds: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="general-ward-beds">General Ward Beds</Label>
                          <Input
                            id="general-ward-beds"
                            type="number"
                            placeholder="400"
                            value={newHospital.generalWardBeds}
                            onChange={(e) => setNewHospital({ ...newHospital, generalWardBeds: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="icu-beds">ICU Beds</Label>
                          <Input
                            id="icu-beds"
                            type="number"
                            placeholder="50"
                            value={newHospital.icuBeds}
                            onChange={(e) => setNewHospital({ ...newHospital, icuBeds: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="ventilators">Ventilators</Label>
                          <Input
                            id="ventilators"
                            type="number"
                            placeholder="30"
                            value={newHospital.ventilators}
                            onChange={(e) => setNewHospital({ ...newHospital, ventilators: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Medical Staff - Doctors */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground">Medical Staff - Doctors by Specialty</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="emergency-doctors">Emergency</Label>
                          <Input
                            id="emergency-doctors"
                            type="number"
                            placeholder="10"
                            value={newHospital.emergencyDoctors}
                            onChange={(e) => setNewHospital({ ...newHospital, emergencyDoctors: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardiology-doctors">Cardiology</Label>
                          <Input
                            id="cardiology-doctors"
                            type="number"
                            placeholder="8"
                            value={newHospital.cardiologyDoctors}
                            onChange={(e) => setNewHospital({ ...newHospital, cardiologyDoctors: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="neurology-doctors">Neurology</Label>
                          <Input
                            id="neurology-doctors"
                            type="number"
                            placeholder="6"
                            value={newHospital.neurologyDoctors}
                            onChange={(e) => setNewHospital({ ...newHospital, neurologyDoctors: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="orthopedics-doctors">Orthopedics</Label>
                          <Input
                            id="orthopedics-doctors"
                            type="number"
                            placeholder="5"
                            value={newHospital.orthopedicsDoctors}
                            onChange={(e) => setNewHospital({ ...newHospital, orthopedicsDoctors: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="general-doctors">General Medicine</Label>
                          <Input
                            id="general-doctors"
                            type="number"
                            placeholder="15"
                            value={newHospital.generalDoctors}
                            onChange={(e) => setNewHospital({ ...newHospital, generalDoctors: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Medical Staff - Nurses */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground">Medical Staff - Nurses</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nurses">Total Nurses</Label>
                          <Input
                            id="nurses"
                            type="number"
                            placeholder="100"
                            value={newHospital.nurses}
                            onChange={(e) => setNewHospital({ ...newHospital, nurses: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="emergency-nurses">Emergency Nurses</Label>
                          <Input
                            id="emergency-nurses"
                            type="number"
                            placeholder="25"
                            value={newHospital.emergencyNurses}
                            onChange={(e) => setNewHospital({ ...newHospital, emergencyNurses: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button variant="outline" className="flex-1" onClick={() => setIsAddHospitalOpen(false)}>
                        Cancel
                      </Button>
                      <Button className="flex-1" onClick={handleAddHospital}>
                        Register Hospital
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Hospitals Table */}
            <Card>
              <CardHeader>
                <CardTitle>Registered Hospitals ({hospitals.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hospital Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-center">Total Beds</TableHead>
                      <TableHead className="text-center">Available Beds</TableHead>
                      <TableHead className="text-center">ICU Beds</TableHead>
                      <TableHead className="text-center">Available ICU</TableHead>
                      <TableHead className="text-center">Occupancy</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hospitals.map((hospital) => (
                      <TableRow key={hospital.id}>
                        <TableCell className="font-medium">{hospital.name}</TableCell>
                        <TableCell className="text-muted-foreground">{hospital.location}</TableCell>
                        <TableCell className="text-center">{hospital.total_beds}</TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            className="w-20 h-8 text-center"
                            value={hospital.available_beds}
                            onChange={(e) => handleUpdateHospitalBeds(hospital.id, 'beds', parseInt(e.target.value) || 0)}
                            max={hospital.total_beds}
                            min={0}
                          />
                        </TableCell>
                        <TableCell className="text-center">{hospital.icu_beds}</TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            className="w-20 h-8 text-center"
                            value={hospital.available_icu_beds}
                            onChange={(e) => handleUpdateHospitalBeds(hospital.id, 'icu', parseInt(e.target.value) || 0)}
                            max={hospital.icu_beds}
                            min={0}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-mono font-bold ${
                            hospital.occupancy >= 90 ? 'text-triage-red' :
                            hospital.occupancy >= 75 ? 'text-triage-yellow' :
                            'text-triage-green'
                          }`}>
                            {hospital.occupancy}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            hospital.status === 'CRITICAL' ? 'bg-triage-red/20 text-triage-red' :
                            hospital.status === 'BUSY' ? 'bg-triage-yellow/20 text-triage-yellow' :
                            'bg-triage-green/20 text-triage-green'
                          }`}>
                            {hospital.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.info(`Viewing details for ${hospital.name}`)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Hospital Details Dialog */}
      <Dialog open={isHospitalDetailsOpen} onOpenChange={setIsHospitalDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {selectedHospitalDetails?.name || 'Hospital Details'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedHospitalDetails && (
            <div className="space-y-6">
              {/* Status Overview */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      selectedHospitalDetails.status === "CRITICAL" ? "bg-triage-red/20 text-triage-red" :
                      selectedHospitalDetails.status === "BUSY" ? "bg-triage-yellow/20 text-triage-yellow" :
                      "bg-triage-green/20 text-triage-green"
                    }`}>
                      {selectedHospitalDetails.status}
                    </span>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedHospitalDetails.occupancy}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Bed Capacity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bed Capacity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Total Beds</div>
                      <div className="text-2xl font-bold">{selectedHospitalDetails.total_beds || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Available Beds</div>
                      <div className="text-2xl font-bold text-triage-green">{selectedHospitalDetails.available_beds || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Occupied Beds</div>
                      <div className="text-2xl font-bold text-triage-red">
                        {(selectedHospitalDetails.total_beds || 0) - (selectedHospitalDetails.available_beds || 0)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">General Ward</div>
                      <div className="text-xl font-semibold">{selectedHospitalDetails.general_ward_beds || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">ICU Beds</div>
                      <div className="text-xl font-semibold">{selectedHospitalDetails.icu_beds || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Ventilators</div>
                      <div className="text-xl font-semibold">{selectedHospitalDetails.ventilators || 0}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Staffing */}
              {selectedHospitalDetails.staff && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Staffing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium mb-2">Doctors by Specialty</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {selectedHospitalDetails.staff.doctors && (
                            <>
                              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                                <span className="text-muted-foreground">Emergency:</span>
                                <span className="font-semibold">{selectedHospitalDetails.staff.doctors.emergency || 0}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                                <span className="text-muted-foreground">Cardiology:</span>
                                <span className="font-semibold">{selectedHospitalDetails.staff.doctors.cardiology || 0}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                                <span className="text-muted-foreground">Neurology:</span>
                                <span className="font-semibold">{selectedHospitalDetails.staff.doctors.neurology || 0}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                                <span className="text-muted-foreground">Orthopedics:</span>
                                <span className="font-semibold">{selectedHospitalDetails.staff.doctors.orthopedics || 0}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                                <span className="text-muted-foreground">General:</span>
                                <span className="font-semibold">{selectedHospitalDetails.staff.doctors.general || 0}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Nurses</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {selectedHospitalDetails.staff.nurses && (
                            <>
                              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                                <span className="text-muted-foreground">Total Nurses:</span>
                                <span className="font-semibold">{selectedHospitalDetails.staff.nurses.total || 0}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                                <span className="text-muted-foreground">Emergency Nurses:</span>
                                <span className="font-semibold">{selectedHospitalDetails.staff.nurses.emergency || 0}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{selectedHospitalDetails.location || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Wait Time:</span>
                      <span className="font-medium">{selectedHospitalDetails.wait || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Waiting Patients:</span>
                      <span className="font-medium">{selectedHospitalDetails.waiting_patients || 0}</span>
                    </div>
                    {selectedHospitalDetails.surge && (
                      <div className="flex items-center gap-2 mt-3 p-2 bg-triage-red/10 border border-triage-red/30 rounded">
                        <TrendingUp className="w-4 h-4 text-triage-red" />
                        <span className="text-sm font-medium text-triage-red">Surge Alert Active</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}