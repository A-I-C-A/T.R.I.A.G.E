import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Wind, 
  Activity, 
  Thermometer, 
  Brain, 
  AlertCircle,
  CheckCircle2,
  LogOut,
  Hospital,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router";
import { toast } from "sonner";

// Mock Data
const SYMPTOMS = [
  "Chest Pain", "Shortness of Breath", "Abdominal Pain", "Headache", 
  "Fever", "Trauma", "Bleeding", "Dizziness", "Nausea", "Vomiting"
];

const RISK_FACTORS = [
  "Diabetes", "Hypertension", "Heart Disease", "Asthma", 
  "Immunocompromised", "Pregnancy", "Elderly (>65)", "Recent Surgery"
];

const SPECIALTIES = [
  { id: "Trauma", name: "Emergency / Trauma", icon: AlertCircle, color: "text-orange-500" },
  { id: "Cardiology", name: "Cardiology", icon: Heart, color: "text-red-500" },
  { id: "Pulmonology", name: "Pulmonology", icon: Wind, color: "text-blue-500" },
  { id: "Neurology", name: "Neurology", icon: Brain, color: "text-purple-500" },
  { id: "General", name: "General Medicine", icon: Activity, color: "text-green-500" },
];

export default function NurseView() {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState("");
  const [vitals, setVitals] = useState({
    hr: "",
    rr: "",
    bpSys: "",
    bpDia: "",
    spo2: "",
    temp: "",
    avpu: "Alert"
  });
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("General");
  const [triageResult, setTriageResult] = useState<any>(null);

  const handleVitalChange = (key: string, value: string) => {
    setVitals(prev => ({ ...prev, [key]: value }));
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom) 
        : [...prev, symptom]
    );
  };

  const toggleRisk = (risk: string) => {
    setSelectedRisks(prev => 
      prev.includes(risk) 
        ? prev.filter(r => r !== risk) 
        : [...prev, risk]
    );
  };

  const calculateTriage = () => {
    // Mock Triage Calculation Logic
    let score = 0;
    const reasons = [];
    
    // Simple mock logic for demo
    if (Number(vitals.hr) > 120 || Number(vitals.hr) < 40) { score += 2; reasons.push("Abnormal Heart Rate"); }
    if (Number(vitals.spo2) < 90) { score += 3; reasons.push("Critical SpO2"); }
    if (selectedSymptoms.includes("Chest Pain")) { score += 2; reasons.push("Chest Pain Reported"); }
    
    let priority = "GREEN";
    if (score >= 5) priority = "RED";
    else if (score >= 2) priority = "YELLOW";

    setTriageResult({
      priority,
      score,
      reasons,
      specialty: selectedSpecialty,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const confirmTriage = () => {
    toast.success("Patient Registered & Triaged", {
      description: `Assigned Priority: ${triageResult.priority} | Specialty: ${triageResult.specialty}`
    });
    setTriageResult(null);
    setPatientId("");
    setVitals({ hr: "", rr: "", bpSys: "", bpDia: "", spo2: "", temp: "", avpu: "Alert" });
    setSelectedSymptoms([]);
    setSelectedRisks([]);
    setSelectedSpecialty("General");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 border-b border-border/50 glass-panel flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Hospital className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-lg">T.R.I.A.G.E</h1>
            <p className="text-xs text-muted-foreground font-mono">UNIT: ER-NORTH-1</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border/50">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-mono font-medium">QUEUE: 12</span>
            <span className="w-2 h-2 rounded-full bg-triage-green animate-pulse ml-2" />
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Demographics */}
        <div className="w-[40%] border-r border-border/50 p-8 flex flex-col gap-8 bg-card/30 backdrop-blur-sm">
          <div>
            <h2 className="text-2xl font-light mb-6 flex items-center gap-2">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Patient Identification
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground uppercase text-xs tracking-widest">Patient ID / Scan</Label>
                <div className="relative">
                  <Input 
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="h-16 text-2xl font-mono tracking-wider bg-background/50"
                    placeholder="XXX-0000"
                    autoFocus
                  />
                  {patientId.length > 3 && (
                    <CheckCircle2 className="absolute right-4 top-5 w-6 h-6 text-triage-green" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground uppercase text-xs tracking-widest">Age</Label>
                  <Input className="h-12 text-lg bg-background/50" type="number" placeholder="00" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground uppercase text-xs tracking-widest">Gender</Label>
                  <Select>
                    <SelectTrigger className="h-12 text-lg bg-background/50">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">Male</SelectItem>
                      <SelectItem value="f">Female</SelectItem>
                      <SelectItem value="o">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-light mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary/50 rounded-full" />
              Clinical Notes
            </h2>
            <textarea 
              className="w-full h-full min-h-[200px] bg-background/50 border border-input rounded-md p-4 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter chief complaint and observations..."
            />
          </div>
        </div>

        {/* Right Panel - Triage Assessment */}
        <div className="w-[60%] p-8 flex flex-col gap-8 overflow-y-auto bg-background/50">
          {/* Vitals Grid */}
          <div>
            <h2 className="text-2xl font-light mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Vital Signs
            </h2>
            
            <div className="grid grid-cols-3 gap-4">
              <VitalInput 
                label="Heart Rate" 
                unit="BPM" 
                icon={Heart} 
                value={vitals.hr}
                onChange={(v: string) => handleVitalChange("hr", v)}
                min={60} max={100}
              />
              <VitalInput 
                label="Resp. Rate" 
                unit="RPM" 
                icon={Wind} 
                value={vitals.rr}
                onChange={(v: string) => handleVitalChange("rr", v)}
                min={12} max={20}
              />
              <VitalInput 
                label="SpO2" 
                unit="%" 
                icon={Activity} 
                value={vitals.spo2}
                onChange={(v: string) => handleVitalChange("spo2", v)}
                min={95} max={100}
              />
              <div className="col-span-1 space-y-2">
                <Label className="text-muted-foreground uppercase text-xs tracking-widest">Blood Pressure</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="SYS" 
                    className="h-16 text-2xl text-center font-mono bg-card/80"
                    value={vitals.bpSys}
                    onChange={(e) => handleVitalChange("bpSys", e.target.value)}
                  />
                  <Input 
                    placeholder="DIA" 
                    className="h-16 text-2xl text-center font-mono bg-card/80"
                    value={vitals.bpDia}
                    onChange={(e) => handleVitalChange("bpDia", e.target.value)}
                  />
                </div>
              </div>
              <VitalInput 
                label="Temp" 
                unit="°C" 
                icon={Thermometer} 
                value={vitals.temp}
                onChange={(v: string) => handleVitalChange("temp", v)}
                min={36.5} max={37.5}
              />
              <div className="space-y-2">
                <Label className="text-muted-foreground uppercase text-xs tracking-widest flex items-center gap-2">
                  <Brain className="w-3 h-3" /> Consciousness
                </Label>
                <Select value={vitals.avpu} onValueChange={(v) => handleVitalChange("avpu", v)}>
                  <SelectTrigger className="h-16 text-xl font-medium bg-card/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alert">Alert</SelectItem>
                    <SelectItem value="Voice">Voice</SelectItem>
                    <SelectItem value="Pain">Pain</SelectItem>
                    <SelectItem value="Unresponsive">Unresponsive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Specialty Selection */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Suggested Specialty</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SPECIALTIES.map(specialty => {
                const Icon = specialty.icon;
                return (
                  <div
                    key={specialty.id}
                    onClick={() => setSelectedSpecialty(specialty.id)}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      selectedSpecialty === specialty.id
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border/50 bg-card/50 hover:border-border hover:bg-card/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${selectedSpecialty === specialty.id ? "bg-primary/20" : "bg-background/50"}`}>
                        <Icon className={`w-5 h-5 ${specialty.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{specialty.name}</div>
                      </div>
                      {selectedSpecialty === specialty.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Symptoms & Risks */}
          <div className="grid grid-cols-1 gap-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Presenting Symptoms</h3>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map(s => (
                  <Badge
                    key={s}
                    variant={selectedSymptoms.includes(s) ? "default" : "outline"}
                    className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                      selectedSymptoms.includes(s) 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "hover:bg-secondary"
                    }`}
                    onClick={() => toggleSymptom(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Risk Factors</h3>
              <div className="flex flex-wrap gap-2">
                {RISK_FACTORS.map(r => (
                  <Badge
                    key={r}
                    variant={selectedRisks.includes(r) ? "destructive" : "outline"}
                    className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                      selectedRisks.includes(r) 
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                        : "hover:bg-secondary border-destructive/30 text-destructive"
                    }`}
                    onClick={() => toggleRisk(r)}
                  >
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-auto pt-8 flex justify-end">
            <Button 
              size="lg" 
              className="h-24 px-12 text-2xl font-bold tracking-tight shadow-2xl shadow-primary/20 hover:scale-105 transition-transform"
              onClick={calculateTriage}
            >
              CALCULATE TRIAGE
              <Activity className="ml-4 w-8 h-8 animate-pulse" />
            </Button>
          </div>
        </div>
      </div>

      {/* Triage Result Modal */}
      <AnimatePresence>
        {triageResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl glass-panel rounded-2xl p-8 border-2 border-border shadow-2xl"
            >
              <div className="text-center mb-8">
                <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">Triage Assessment Complete</h2>
                <div className={`inline-flex items-center justify-center w-48 h-48 rounded-full border-8 text-5xl font-black tracking-tighter mb-6 shadow-[0_0_40px_rgba(0,0,0,0.2)]
                  ${triageResult.priority === 'RED' ? 'border-triage-red bg-triage-red/10 text-triage-red animate-pulse' : 
                    triageResult.priority === 'YELLOW' ? 'border-triage-yellow bg-triage-yellow/10 text-triage-yellow' : 
                    'border-triage-green bg-triage-green/10 text-triage-green'}`}
                >
                  {triageResult.priority}
                </div>
                <p className="text-2xl font-light">Score: <span className="font-bold">{triageResult.score}</span></p>
              </div>

              {/* Suggested Specialty Display */}
              <div className="bg-card/50 rounded-xl p-4 mb-6 border border-border/50">
                <h3 className="font-bold mb-3 text-sm uppercase tracking-widest text-muted-foreground">Suggested Specialty</h3>
                <div className="flex items-center gap-3">
                  {(() => {
                    const specialty = SPECIALTIES.find(s => s.id === triageResult.specialty);
                    const Icon = specialty?.icon || Activity;
                    return (
                      <>
                        <div className="p-2 rounded-md bg-primary/10">
                          <Icon className={`w-5 h-5 ${specialty?.color || "text-primary"}`} />
                        </div>
                        <span className="font-medium text-lg">{specialty?.name || triageResult.specialty}</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="bg-card/50 rounded-xl p-6 mb-8">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Clinical Reasoning
                </h3>
                <ul className="space-y-2">
                  {triageResult.reasons.length > 0 ? (
                    triageResult.reasons.map((r: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {r}
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground italic">No critical factors identified.</li>
                  )}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" size="lg" className="h-14 text-lg" onClick={() => setTriageResult(null)}>
                  Adjust Input
                </Button>
                <Button size="lg" className="h-14 text-lg font-bold" onClick={confirmTriage}>
                  CONFIRM & REGISTER
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VitalInput({ label, unit, icon: Icon, value, onChange, min, max }: any) {
  const numVal = Number(value);
  const isWarning = value && (numVal < min || numVal > max);
  
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground uppercase text-xs tracking-widest flex items-center gap-2">
        <Icon className="w-3 h-3" /> {label}
      </Label>
      <div className="relative">
        <Input 
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-16 text-2xl text-center font-mono transition-colors ${
            isWarning ? "bg-triage-red/10 border-triage-red text-triage-red" : "bg-card/80"
          }`}
          placeholder="--"
        />
        <span className="absolute right-3 bottom-2 text-xs text-muted-foreground font-mono">{unit}</span>
      </div>
    </div>
  );
}