import { useState } from "react";
import { toast } from "sonner";
import { INITIAL_QUEUE } from "@/components/doctor/constants";
import { DoctorDutyModal } from "@/components/doctor/DoctorDutyModal";
import { DoctorHeader } from "@/components/doctor/DoctorHeader";
import { DoctorQueueTable } from "@/components/doctor/DoctorQueueTable";
import { DoctorPatientDetail } from "@/components/doctor/DoctorPatientDetail";

export default function DoctorView() {
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [filter, setFilter] = useState("ALL");
  const [specialtyFilter, setSpecialtyFilter] = useState("ALL");
  const [dutyFocus, setDutyFocus] = useState<string | null>(null);
  const [showDutyModal, setShowDutyModal] = useState(true);
  const [currentDoctor] = useState("Dr. Smith"); // Mock current doctor

  const handleClaim = (patientId: string) => {
    setQueue(queue.map(p => 
      p.id === patientId ? { ...p, claimedBy: currentDoctor } : p
    ));
    toast.success("Patient claimed successfully");
    if (selectedPatient?.id === patientId) {
      setSelectedPatient({ ...selectedPatient, claimedBy: currentDoctor });
    }
  };

  const handleDutySelect = (specialtyId: string) => {
    setDutyFocus(specialtyId);
    setSpecialtyFilter(specialtyId === "ALL" ? "ALL" : specialtyId);
    setShowDutyModal(false);
    toast.info(`Duty focus set to ${specialtyId === "ALL" ? "All Departments" : specialtyId}`);
  };

  const filteredQueue = queue.filter(p => {
    const priorityMatch = filter === "ALL" || p.priority === filter;
    const specialtyMatch = specialtyFilter === "ALL" || p.specialty === specialtyFilter;
    return priorityMatch && specialtyMatch;
  }).sort((a, b) => {
    // Sort by claimed by me first, then priority
    if (a.claimedBy === currentDoctor && b.claimedBy !== currentDoctor) return -1;
    if (b.claimedBy === currentDoctor && a.claimedBy !== currentDoctor) return 1;
    
    const priorityOrder: any = { RED: 0, YELLOW: 1, GREEN: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const myActivePatients = queue.filter(p => p.claimedBy === currentDoctor).length;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden relative">
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
          currentDoctor={currentDoctor}
        />

        {selectedPatient && (
          <DoctorPatientDetail 
            patient={selectedPatient}
            currentDoctor={currentDoctor}
            onClaim={handleClaim}
          />
        )}
      </div>
    </div>
  );
}