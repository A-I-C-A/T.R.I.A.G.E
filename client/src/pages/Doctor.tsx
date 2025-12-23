import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DoctorDutyModal } from "@/components/doctor/DoctorDutyModal";
import { DoctorHeader } from "@/components/doctor/DoctorHeader";
import { DoctorQueueTable } from "@/components/doctor/DoctorQueueTable";
import { DoctorPatientDetail } from "@/components/doctor/DoctorPatientDetail";
import { useAuth } from "@/hooks/use-auth";
import { patientAPI } from "@/services/api";
import { wsService } from "@/services/websocket";
import { useNavigate } from "react-router-dom";

export default function DoctorView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [filter, setFilter] = useState("ALL");
  const [specialtyFilter, setSpecialtyFilter] = useState("ALL");
  const [dutyFocus, setDutyFocus] = useState<string | null>(null);
  const [showDutyModal, setShowDutyModal] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch patients on mount
  useEffect(() => {
    loadPatients();

    // WebSocket listeners
    wsService.on('patient-created', handlePatientCreated);
    wsService.on('patient-updated', handlePatientUpdated);

    return () => {
      wsService.off('patient-created', handlePatientCreated);
      wsService.off('patient-updated', handlePatientUpdated);
    };
  }, []);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const response = await patientAPI.getPatients({ 
        status: 'waiting,in-treatment',
        hospitalId: user?.hospitalId 
      });
      setQueue(response.data.patients || []);
    } catch (error: any) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patient queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientCreated = (patient: any) => {
    // Normalize the patient data from WebSocket
    const normalized = {
      ...patient,
      triageLevel: patient.priority,
      specialty: patient.recommended_specialty || 'General',
      recommendedSpecialty: patient.recommended_specialty || 'General',
      doctorId: patient.doctor_id,
      patientId: patient.patient_id,
      vitals: patient.latest_vitals ? {
        hr: patient.latest_vitals.heart_rate,
        rr: patient.latest_vitals.respiratory_rate,
        bpSys: patient.latest_vitals.systolic_bp,
        bpDia: patient.latest_vitals.diastolic_bp,
        spo2: patient.latest_vitals.oxygen_saturation,
        temp: patient.latest_vitals.temperature,
        avpu: patient.latest_vitals.consciousness
      } : {},
      symptoms: Array.isArray(patient.symptoms) ? patient.symptoms.map((s: any) => 
        typeof s === 'string' ? s : s.symptom
      ) : [],
      claimedBy: patient.doctor_id ? `Doctor #${patient.doctor_id}` : null
    };
    
    setQueue(prev => [normalized, ...prev]);
    toast.info('New patient arrived', {
      description: `${patient.name} - Priority: ${patient.priority}`
    });
  };

  const handlePatientUpdated = (updatedPatient: any) => {
    setQueue(prev => prev.map(p => 
      p.id === updatedPatient.id ? updatedPatient : p
    ));
    if (selectedPatient?.id === updatedPatient.id) {
      setSelectedPatient(updatedPatient);
    }
  };

  const handleClaim = async (patientId: string) => {
    try {
      const response = await patientAPI.assignDoctor(patientId, user?.id || '');
      setQueue(queue.map(p => 
        p.id === patientId ? response.data.patient : p
      ));
      toast.success("Patient claimed successfully");
      if (selectedPatient?.id === patientId) {
        setSelectedPatient(response.data.patient);
      }
    } catch (error: any) {
      console.error('Error claiming patient:', error);
      toast.error('Failed to claim patient');
    }
  };

  const handleDutySelect = (specialtyId: string) => {
    setDutyFocus(specialtyId);
    setSpecialtyFilter(specialtyId === "ALL" ? "ALL" : specialtyId);
    setShowDutyModal(false);
    toast.info(`Duty focus set to ${specialtyId === "ALL" ? "All Departments" : specialtyId}`);
  };

  const filteredQueue = queue.filter(p => {
    const priorityMatch = filter === "ALL" || p.triageLevel === filter;
    const specialtyMatch = specialtyFilter === "ALL" || p.recommendedSpecialty === specialtyFilter;
    return priorityMatch && specialtyMatch;
  }).sort((a, b) => {
    // Sort by claimed by me first, then priority
    if (a.doctorId === user?.id && b.doctorId !== user?.id) return -1;
    if (b.doctorId === user?.id && a.doctorId !== user?.id) return 1;
    
    const priorityOrder: any = { RED: 0, YELLOW: 1, GREEN: 2, BLUE: 3 };
    return priorityOrder[a.triageLevel] - priorityOrder[b.triageLevel];
  });

  const myActivePatients = queue.filter(p => p.doctorId === user?.id).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading patient queue...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <DoctorDutyModal 
        open={showDutyModal} 
        onOpenChange={setShowDutyModal} 
        onSelect={handleDutySelect} 
        queue={queue} 
      />

      <DoctorHeader 
        onOpenDutyModal={() => setShowDutyModal(true)}
        dutyFocus={dutyFocus}
        myActivePatients={myActivePatients}
        onResetFilters={() => {
          setFilter("ALL");
          setSpecialtyFilter("ALL");
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        <DoctorQueueTable 
          queue={filteredQueue}
          filter={filter}
          setFilter={setFilter}
          specialtyFilter={specialtyFilter}
          setSpecialtyFilter={setSpecialtyFilter}
          selectedPatient={selectedPatient}
          setSelectedPatient={setSelectedPatient}
          currentDoctor={user?.email || 'Doctor'}
        />

        {selectedPatient && (
          <DoctorPatientDetail 
            patient={selectedPatient}
            currentDoctor={user?.email || 'Doctor'}
            onClaim={handleClaim}
          />
        )}
      </div>
    </div>
  );
}