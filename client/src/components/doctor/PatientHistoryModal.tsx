import { useState, useEffect } from "react";
import { X, Activity, Calendar, AlertCircle, FileText, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";

interface PatientHistoryModalProps {
  patientId: number;
  onClose: () => void;
}

export function PatientHistoryModal({ patientId, onClose }: PatientHistoryModalProps) {
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [patientId]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 
        (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000');
      const response = await axios.get(
        `${apiUrl}/api/patients/${patientId}/history`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setHistory(response.data);
      setDoctorNotes(response.data.patient.doctor_notes || "");
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error('Failed to load patient history');
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 
        (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000');
      await axios.put(
        `${apiUrl}/api/patients/${patientId}/doctor-notes`,
        { notes: doctorNotes },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Doctor notes saved successfully');
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast.error('Failed to save doctor notes');
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-card rounded-xl p-8 w-full max-w-4xl border border-border shadow-2xl">
          <div className="text-center">Loading patient history...</div>
        </div>
      </div>
    );
  }

  if (!history) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-xl w-full max-w-5xl max-h-[90vh] border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-6 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Patient History
            </h2>
            <p className="text-muted-foreground mt-1">
              {history.patient.name} • ID: {history.patient.patient_id}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nurse Clinical Notes */}
          {history.patient.clinical_notes && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <h3 className="font-bold text-sm uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Nurse Clinical Notes
              </h3>
              <p className="text-sm whitespace-pre-wrap">{history.patient.clinical_notes}</p>
            </div>
          )}

          {/* Doctor Notes */}
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <h3 className="font-bold text-sm uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Doctor Notes
            </h3>
            <Textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Add your clinical observations, diagnosis, treatment plan..."
              className="min-h-[120px] mb-2"
            />
            <Button onClick={handleSaveNotes} disabled={savingNotes} size="sm">
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>

          {/* Triage History */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Triage History
            </h3>
            <div className="space-y-2">
              {history.triageHistory.map((entry: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-background/50 border border-border/50 flex items-start gap-3">
                  <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {entry.old_priority && (
                        <>
                          <Badge variant="outline">{entry.old_priority}</Badge>
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <Badge className={
                        entry.new_priority === 'RED' ? 'bg-triage-red' :
                        entry.new_priority === 'YELLOW' ? 'bg-triage-yellow text-black' :
                        'bg-triage-green'
                      }>
                        {entry.new_priority}
                      </Badge>
                      {entry.auto_escalated && (
                        <Badge variant="secondary" className="text-xs">AUTO</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(entry.changed_at), 'MMM dd, yyyy HH:mm:ss')}
                      {entry.triggered_by_name && ` • by ${entry.triggered_by_name}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vital Signs History */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Vital Signs History
            </h3>
            <div className="space-y-2">
              {history.vitalHistory.map((vitals: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-background/50 border border-border/50">
                  <div className="grid grid-cols-4 gap-3 mb-2">
                    <div>
                      <div className="text-xs text-muted-foreground">HR</div>
                      <div className="font-mono font-bold">{vitals.heart_rate || '-'} bpm</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">BP</div>
                      <div className="font-mono font-bold">
                        {vitals.systolic_bp && vitals.diastolic_bp 
                          ? `${vitals.systolic_bp}/${vitals.diastolic_bp}` 
                          : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">SpO2</div>
                      <div className="font-mono font-bold">{vitals.oxygen_saturation || '-'}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Temp</div>
                      <div className="font-mono font-bold">{vitals.temperature || '-'}°C</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(vitals.recorded_at), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          {history.symptoms.length > 0 && (
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Recorded Symptoms
              </h3>
              <div className="flex flex-wrap gap-2">
                {history.symptoms.map((s: any, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {s.symptom} ({s.severity})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Risk Factors */}
          {history.riskFactors.length > 0 && (
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Risk Factors
              </h3>
              <div className="flex flex-wrap gap-2">
                {history.riskFactors.map((r: any, idx: number) => (
                  <Badge key={idx} variant="outline" className="bg-yellow-500/10 border-yellow-500/30">
                    {r.factor}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {history.alerts.length > 0 && (
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Alerts
              </h3>
              <div className="space-y-2">
                {history.alerts.map((alert: any, idx: number) => (
                  <div key={idx} className={`p-3 rounded-lg border ${
                    alert.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                    alert.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                    'bg-yellow-500/10 border-yellow-500/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{alert.type}</Badge>
                      <Badge variant="outline" className="text-xs">{alert.severity}</Badge>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(alert.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
