import { useState, useEffect } from "react";
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
  Users,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { patientAPI } from "@/services/api";
import { wsService } from "@/services/websocket";

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
  const { user, logout } = useAuth();
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Male");
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  // Fetch queue count
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const response = await patientAPI.getPatients({ status: 'waiting' });
        setQueueCount(response.data.length);
      } catch (error) {
        console.error("Failed to fetch queue:", error);
      }
    };
    fetchQueue();
  }, [triageResult]); // Refetch when triage result changes

  const handleVitalChange = (key: string, value: string) => {
    setVitals(prev => ({ ...prev, [key]: value }));
  };

  const handleAgeChange = (value: string) => {
    const age = Number(value);
    if (value === "" || (age >= 0 && age <= 150)) {
      setPatientAge(value);
    }
  };

  const isAgeInvalid = patientAge !== "" && (Number(patientAge) < 0 || Number(patientAge) > 150);

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
    // Simple triage calculation
    let score = 0;
    const reasons = [];
    
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

  const confirmTriage = async () => {
    if (!patientName || !patientAge) {
      toast.error("Please enter patient name and age");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create patient ID
      const patientId = `P-${Date.now()}`;
      
      // Prepare request matching backend schema exactly
      const requestData = {
        patientId,
        name: patientName,
        age: Number(patientAge),
        gender: patientGender.toLowerCase(), // backend expects lowercase
        contact: "",
        triageInput: {
          vitalSigns: {
            heartRate: vitals.hr ? Number(vitals.hr) : undefined,
            respiratoryRate: vitals.rr ? Number(vitals.rr) : undefined,
            systolicBP: vitals.bpSys ? Number(vitals.bpSys) : undefined,
            diastolicBP: vitals.bpDia ? Number(vitals.bpDia) : undefined,
            oxygenSaturation: vitals.spo2 ? Number(vitals.spo2) : undefined,
            temperature: vitals.temp ? Number(vitals.temp) : undefined,
            consciousness: vitals.avpu.toLowerCase() // 'alert' | 'verbal' | 'pain' | 'unresponsive'
          },
          symptoms: selectedSymptoms.map(s => ({
            symptom: s,
            severity: 'moderate' // default severity, could make this selectable
          })),
          riskFactors: selectedRisks.map(r => ({
            factor: r,
            category: 'medical' // default category
          }))
        }
      };

      const response = await patientAPI.createPatient(requestData);

      toast.success("Patient Registered & Triaged", {
        description: `Priority: ${response.data.patient.priority} | ID: ${response.data.patient.patient_id}`
      });

      // Emit WebSocket event
      wsService.emit('patient-created', response.data.patient);

      // Reset form
      setTriageResult(null);
      setPatientName("");
      setPatientAge("");
      setPatientGender("Male");
      setVitals({ hr: "", rr: "", bpSys: "", bpDia: "", spo2: "", temp: "", avpu: "Alert" });
      setSelectedSymptoms([]);
      setSelectedRisks([]);
      setSelectedSpecialty("General");
    } catch (error: any) {
      console.error("Error creating patient:", error);
      toast.error(error.response?.data?.error || "Failed to create patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-border/50 glass-panel flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-lg">T.R.I.A.G.E</h1>
            <p className="text-xs text-muted-foreground font-mono">UNIT: ER-NORTH-1</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border/50">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-mono font-medium">QUEUE: {queueCount}</span>
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
                <Label className="text-muted-foreground uppercase text-xs tracking-widest">Patient Name</Label>
                <Input 
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="h-12 text-lg bg-background/50"
                  placeholder="Enter patient name"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground uppercase text-xs tracking-widest">Age</Label>
                  <Input 
                    className={`h-12 text-lg ${
                      isAgeInvalid ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-background/50'
                    }`}
                    type="number" 
                    placeholder="0-150"
                    value={patientAge}
                    onChange={(e) => handleAgeChange(e.target.value)}
                    min={0}
                    max={150}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('heart-rate-input')?.focus();
                      }
                    }}
                  />
                  {isAgeInvalid && (
                    <p className="text-xs text-red-500">Age must be between 0-150</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground uppercase text-xs tracking-widest">Gender</Label>
                  <Select value={patientGender} onValueChange={setPatientGender}>
                    <SelectTrigger className="h-12 text-lg bg-background/50">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
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
                normalRange="60-100"
                id="heart-rate-input"
                onEnter={() => document.getElementById('resp-rate-input')?.focus()}
              />
              <VitalInput 
                label="Resp. Rate" 
                unit="RPM" 
                icon={Wind} 
                value={vitals.rr}
                onChange={(v: string) => handleVitalChange("rr", v)}
                min={12} max={20}
                normalRange="12-20"
                id="resp-rate-input"
                onEnter={() => document.getElementById('spo2-input')?.focus()}
              />
              <VitalInput 
                label="SpO2" 
                unit="%" 
                icon={Activity} 
                value={vitals.spo2}
                onChange={(v: string) => handleVitalChange("spo2", v)}
                min={95} max={100}
                normalRange="95-100"
                id="spo2-input"
                onEnter={() => document.getElementById('bp-sys-input')?.focus()}
              />
              <div className="col-span-1 space-y-2">
                <Label className="text-muted-foreground uppercase text-xs tracking-widest">Blood Pressure</Label>
                <div className="text-xs text-muted-foreground mb-1">Normal: 90-120 / 60-80</div>
                <div className="flex gap-2">
                  <Input 
                    id="bp-sys-input"
                    placeholder="SYS" 
                    className={`h-16 text-2xl text-center font-mono ${
                      vitals.bpSys && Number(vitals.bpSys) < 0 ? 'bg-red-500/20 border-red-500' : 'bg-card/80'
                    }`}
                    value={vitals.bpSys}
                    onChange={(e) => handleVitalChange("bpSys", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('bp-dia-input')?.focus();
                      }
                    }}
                  />
                  <Input 
                    id="bp-dia-input"
                    placeholder="DIA" 
                    className={`h-16 text-2xl text-center font-mono ${
                      vitals.bpDia && Number(vitals.bpDia) < 0 ? 'bg-red-500/20 border-red-500' : 'bg-card/80'
                    }`}
                    value={vitals.bpDia}
                    onChange={(e) => handleVitalChange("bpDia", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('temp-input')?.focus();
                      }
                    }}
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
                normalRange="36.5-37.5"
                id="temp-input"
                onEnter={() => {}}
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
                  ${triageResult.priority === 'RED' ? 'border-triage-red bg-triage-red text-white animate-pulse' : 
                    triageResult.priority === 'YELLOW' ? 'border-triage-yellow bg-triage-yellow text-black' : 
                    'border-triage-green bg-triage-green text-white'}`}
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
                <Button variant="outline" size="lg" className="h-14 text-lg" onClick={() => setTriageResult(null)} disabled={isSubmitting}>
                  Adjust Input
                </Button>
                <Button size="lg" className="h-14 text-lg font-bold" onClick={confirmTriage} disabled={isSubmitting}>
                  {isSubmitting ? "REGISTERING..." : "CONFIRM & REGISTER"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VitalInput({ label, unit, icon: Icon, value, onChange, min, max, normalRange, id, onEnter }: any) {
  const numVal = Number(value);
  const isWarning = value && (numVal < min || numVal > max);
  const isNegative = value && numVal < 0;
  
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground uppercase text-xs tracking-widest flex items-center gap-2">
        <Icon className="w-3 h-3" /> {label}
      </Label>
      {normalRange && (
        <div className="text-xs text-muted-foreground">Normal: {normalRange}</div>
      )}
      <div className="relative">
        <Input 
          id={id}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-16 text-2xl text-center font-mono transition-colors ${
            isNegative ? "bg-red-500/20 border-red-500" :
            isWarning ? "bg-yellow-500/10 border-yellow-500" : "bg-card/80"
          }`}
          placeholder="--"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onEnter?.();
            }
          }}
        />
        <span className="absolute right-3 bottom-2 text-xs text-muted-foreground font-mono">{unit}</span>
      </div>
    </div>
  );
}