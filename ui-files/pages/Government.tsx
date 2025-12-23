import { useState } from "react";
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

export default function GovernmentView() {
  const navigate = useNavigate();
  const [hoveredHospital, setHoveredHospital] = useState<string | null>(null);

  const hospitals = [
    { name: "Central General", status: "CRITICAL", occupancy: 98, wait: "4h 12m", surge: true, x: 25, y: 30 },
    { name: "North District", status: "BUSY", occupancy: 85, wait: "1h 45m", surge: false, x: 65, y: 25 },
    { name: "St. Mary's", status: "NORMAL", occupancy: 62, wait: "0h 30m", surge: false, x: 50, y: 70 },
    { name: "Westside Trauma", status: "BUSY", occupancy: 78, wait: "2h 10m", surge: false, x: 20, y: 65 },
    { name: "Children's Hospital", status: "NORMAL", occupancy: 45, wait: "0h 15m", surge: false, x: 75, y: 60 },
  ];

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
              {hospitals.map((hospital, index) => (
                <motion.div
                  key={hospital.name}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="absolute cursor-pointer z-10"
                  style={{ left: `${hospital.x}%`, top: `${hospital.y}%` }}
                  onMouseEnter={() => setHoveredHospital(hospital.name)}
                  onMouseLeave={() => setHoveredHospital(null)}
                >
                  {/* Pulsing ring - only for critical/busy */}
                  {(hospital.status === "CRITICAL" || hospital.status === "BUSY") && (
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
                      className={`absolute -inset-4 rounded-full ${getStatusColor(hospital.status)} opacity-40`}
                    />
                  )}
                  
                  {/* Marker */}
                  <div className={`relative w-4 h-4 rounded-full ${getStatusColor(hospital.status)} shadow-lg border-2 border-background hover:scale-150 transition-transform`}>
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
                  {hoveredHospital === hospital.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap glass-card px-3 py-2 rounded-lg border ${getStatusBorderColor(hospital.status)} shadow-xl z-20`}
                    >
                      <div className="text-sm font-bold">{hospital.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {hospital.occupancy}% occupancy • {hospital.wait} wait
                      </div>
                      <div className={`text-xs font-bold mt-1 ${
                        hospital.status === "CRITICAL" ? "text-triage-red" :
                        hospital.status === "BUSY" ? "text-triage-yellow" :
                        "text-triage-green"
                      }`}>
                        {hospital.status}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}

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
                <div className="text-4xl font-bold text-triage-yellow mb-2">ELEVATED</div>
                <p className="text-sm text-muted-foreground">High load detected in Central district. Divert protocols active.</p>
              </CardContent>
            </Card>
            <Card className="glass-card flex-1">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Total Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">82%</div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[82%]" />
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
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
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
                  {hospitals.map((h) => (
                    <TableRow 
                      key={h.name} 
                      className="cursor-pointer hover:bg-secondary/50"
                      onMouseEnter={() => setHoveredHospital(h.name)}
                      onMouseLeave={() => setHoveredHospital(null)}
                    >
                      <TableCell className="font-medium">{h.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          h.status === "CRITICAL" ? "bg-triage-red/20 text-triage-red" :
                          h.status === "BUSY" ? "bg-triage-yellow/20 text-triage-yellow" :
                          "bg-triage-green/20 text-triage-green"
                        }`}>
                          {h.status}
                        </span>
                      </TableCell>
                      <TableCell>{h.occupancy}%</TableCell>
                      <TableCell className="font-mono">{h.wait}</TableCell>
                      <TableCell>
                        {h.surge ? (
                          <TrendingUp className="w-4 h-4 text-triage-red" />
                        ) : (
                          <div className="w-4 h-1 bg-secondary rounded-full" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="glass-card border-triage-red/30 bg-triage-red/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-triage-red">
                <AlertOctagon className="w-5 h-5" />
                Surge Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-background/50 rounded-lg border border-triage-red/20">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">Central District Surge</h3>
                    <span className="text-xs font-mono text-triage-red animate-pulse">ACTIVE</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Unusual spike in respiratory cases reported in the last 2 hours.
                  </p>
                  <div className="text-xs font-mono text-muted-foreground">
                    Started: 14:30 • +45% vs Avg
                  </div>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border border-border/50 opacity-60">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">Westside Traffic Incident</h3>
                    <span className="text-xs font-mono text-muted-foreground">RESOLVED</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Multiple trauma cases incoming.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}