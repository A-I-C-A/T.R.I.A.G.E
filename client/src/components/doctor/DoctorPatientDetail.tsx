import { PlayCircle, Lock, Hand, Activity, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SpecialtyIcon } from "./SpecialtyIcon";
import { format } from "date-fns";
import { AIEnhancedTriage } from "./AIEnhancedTriage";

interface DoctorPatientDetailProps {
  patient: any;
  currentDoctor: string;
  onClaim: (id: string) => void;
}

function VitalCard({ label, value, unit, alert }: any) {
  return (
    <div className={`p-3 rounded-lg border flex justify-between items-end ${
      alert ? "bg-destructive/10 border-destructive/50" : "bg-background/50 border-border/50"
    }`}>
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className={`text-xl font-mono font-bold leading-none mt-1 ${alert ? "text-destructive" : ""}`}>{value}</div>
      </div>
      <div className="text-[10px] text-muted-foreground mb-0.5">{unit}</div>
    </div>
  );
}

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { patientAPI } from "@/services/api";

export function DoctorPatientDetail({ patient, currentDoctor, onClaim }: DoctorPatientDetailProps) {
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    hr: patient.vitals?.hr || "",
    rr: patient.vitals?.rr || "",
    bpSys: patient.vitals?.bpSys || "",
    bpDia: patient.vitals?.bpDia || "",
    spo2: patient.vitals?.spo2 || "",
    temp: patient.vitals?.temp || "",
    avpu: patient.vitals?.avpu || "Alert"
  });
  const [isUpdating, setIsUpdating] = useState(false);

  if (!patient) return null;

  // Calculate waiting time in minutes
  const waitingTime = patient.arrival_time 
    ? Math.floor((new Date().getTime() - new Date(patient.arrival_time).getTime()) / 60000)
    : 0;

  const handleVitalsChange = (key: string, value: string) => {
    setVitalsForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdateVitals = async () => {
    setIsUpdating(true);
    try {
      await patientAPI.updateVitals(String(patient.id), {
        heartRate: vitalsForm.hr ? Number(vitalsForm.hr) : undefined,
        respiratoryRate: vitalsForm.rr ? Number(vitalsForm.rr) : undefined,
        systolicBP: vitalsForm.bpSys ? Number(vitalsForm.bpSys) : undefined,
        diastolicBP: vitalsForm.bpDia ? Number(vitalsForm.bpDia) : undefined,
        oxygenSaturation: vitalsForm.spo2 ? Number(vitalsForm.spo2) : undefined,
        temperature: vitalsForm.temp ? Number(vitalsForm.temp) : undefined,
        consciousness: vitalsForm.avpu?.toLowerCase() || 'alert',
      });
      toast.success('Vitals updated!');
      setShowVitalsModal(false);
      // Refresh the page to ensure latest patient data is shown
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update vitals');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-[30%] border-l border-border/50 bg-card/30 backdrop-blur-md p-6 flex flex-col gap-6 overflow-y-auto">
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-background rounded-xl p-8 w-full max-w-md border border-border">
            <h2 className="text-xl font-bold mb-4">Update Vitals</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input placeholder="Heart Rate (bpm)" value={vitalsForm.hr} onChange={e => handleVitalsChange('hr', e.target.value)} />
              <Input placeholder="Resp. Rate (rpm)" value={vitalsForm.rr} onChange={e => handleVitalsChange('rr', e.target.value)} />
              <Input placeholder="BP Sys" value={vitalsForm.bpSys} onChange={e => handleVitalsChange('bpSys', e.target.value)} />
              <Input placeholder="BP Dia" value={vitalsForm.bpDia} onChange={e => handleVitalsChange('bpDia', e.target.value)} />
              <Input placeholder="SpO2 (%)" value={vitalsForm.spo2} onChange={e => handleVitalsChange('spo2', e.target.value)} />
              <Input placeholder="Temp (°C)" value={vitalsForm.temp} onChange={e => handleVitalsChange('temp', e.target.value)} />
              <Select value={vitalsForm.avpu} onValueChange={v => handleVitalsChange('avpu', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alert">Alert</SelectItem>
                  <SelectItem value="Voice">Voice</SelectItem>
                  <SelectItem value="Pain">Pain</SelectItem>
                  <SelectItem value="Unresponsive">Unresponsive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowVitalsModal(false)} disabled={isUpdating}>Cancel</Button>
              <Button onClick={handleUpdateVitals} loading={isUpdating}>Update</Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{patient.name}</h2>
          <p className="text-muted-foreground font-mono">{patient.id}</p>
        </div>
        <Badge className={`text-lg px-3 py-1 ${
          patient.priority === "RED" ? "bg-triage-red hover:bg-triage-red" :
          patient.priority === "YELLOW" ? "bg-triage-yellow hover:bg-triage-yellow text-black" :
          "bg-triage-green hover:bg-triage-green"
        }`}>
          {patient.priority}
        </Badge>
      </div>

      {/* AI-Enhanced Triage - DETERIORATION PREDICTOR */}
      <AIEnhancedTriage
        patientId={patient.id}
        vitalSigns={{
          heartRate: patient.vitals?.hr,
          respiratoryRate: patient.vitals?.rr,
          systolicBP: patient.vitals?.bpSys,
          diastolicBP: patient.vitals?.bpDia,
          oxygenSaturation: patient.vitals?.spo2,
          temperature: patient.vitals?.temp,
          consciousness: patient.vitals?.avpu?.toLowerCase() || 'alert'
        }}
        symptoms={patient.symptoms || []}
        riskFactors={patient.riskFactors || []}
        age={patient.age}
        currentPriority={patient.priority}
        waitingTime={waitingTime}
      />
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{patient.name}</h2>
          <p className="text-muted-foreground font-mono">{patient.id}</p>
        </div>
        <Badge className={`text-lg px-3 py-1 ${
          patient.priority === "RED" ? "bg-triage-red hover:bg-triage-red" :
          patient.priority === "YELLOW" ? "bg-triage-yellow hover:bg-triage-yellow text-black" :
          "bg-triage-green hover:bg-triage-green"
        }`}>
          {patient.priority}
        </Badge>
      </div>

      {/* Suggested Specialty Card */}
      <div className="p-3 rounded-lg bg-background/40 border border-border/50 flex items-center gap-3">
        <div className="p-2 rounded-md bg-primary/10">
          <SpecialtyIcon name={patient.specialty} />
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Suggested Specialty</div>
          <div className="font-medium text-sm">{patient.specialty}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Age</div>
          <div className="text-xl font-mono">{patient.age || '-'}</div>
        </div>
        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Arrival</div>
          <div className="text-xl font-mono">
            {patient.arrival_time ? format(new Date(patient.arrival_time), 'HH:mm') : '-'}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Latest Vitals</h3>
        <div className="grid grid-cols-2 gap-3">
          <VitalCard label="HR" value={patient.vitals?.hr || '-'} unit="bpm" alert={patient.vitals?.hr > 100} />
          <VitalCard label="SpO2" value={patient.vitals?.spo2 || '-'} unit="%" alert={patient.vitals?.spo2 < 95} />
          <VitalCard label="BP" value={patient.vitals?.bpSys && patient.vitals?.bpDia ? `${patient.vitals.bpSys}/${patient.vitals.bpDia}` : '-'} unit="mmHg" />
          <VitalCard label="Temp" value={patient.vitals?.temp || '-'} unit="°C" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Symptoms</h3>
        <div className="flex flex-wrap gap-2">
          {patient.symptoms && patient.symptoms.length > 0 ? (
            patient.symptoms.map((s: string) => (
              <Badge key={s} variant="secondary">{s}</Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No symptoms recorded</span>
          )}
        </div>
      </div>

      <div className="mt-auto space-y-3">
        {patient.claimedBy === currentDoctor ? (
          <Button className="w-full h-12 text-lg font-bold animate-in fade-in zoom-in duration-300" onClick={() => toast.success("Treatment Started")}>
            <PlayCircle className="mr-2 w-5 h-5" /> START TREATMENT
          </Button>
        ) : patient.claimedBy ? (
          <Button disabled className="w-full h-12 text-lg font-bold opacity-50">
            <Lock className="mr-2 w-4 h-4" /> Being handled by {patient.claimedBy}
          </Button>
        ) : (
          <Button 
            className="w-full h-12 text-lg font-bold bg-primary/90 hover:bg-primary" 
            onClick={() => onClaim(patient.id)}
          >
            <Hand className="mr-2 w-5 h-5" /> CLAIM PATIENT
          </Button>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-10" onClick={() => setShowVitalsModal(true)}>
            <Activity className="mr-2 w-4 h-4" /> Update Vitals
          </Button>
          <Button variant="outline" className="h-10">
            <History className="mr-2 w-4 h-4" /> History
          </Button>
        </div>
      </div>
    </div>
  );
}
