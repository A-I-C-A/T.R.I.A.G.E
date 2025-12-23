import { motion } from "framer-motion";
import { Search, Lock, CheckCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SPECIALTIES } from "./constants";
import { SpecialtyIcon } from "./SpecialtyIcon";

interface DoctorQueueTableProps {
  queue: any[];
  filter: string;
  setFilter: (filter: string) => void;
  specialtyFilter: string;
  setSpecialtyFilter: (filter: string) => void;
  selectedPatient: any;
  setSelectedPatient: (patient: any) => void;
  currentDoctor: string;
}

export function DoctorQueueTable({
  queue,
  filter,
  setFilter,
  specialtyFilter,
  setSpecialtyFilter,
  selectedPatient,
  setSelectedPatient,
  currentDoctor
}: DoctorQueueTableProps) {
  return (
    <div className="flex-1 flex flex-col p-6 gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4">
        {/* Specialty Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={specialtyFilter === "ALL" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSpecialtyFilter("ALL")}
            className="text-xs font-medium whitespace-nowrap"
          >
            All Specialties
          </Button>
          {SPECIALTIES.map(s => (
            <Button
              key={s.id}
              variant={specialtyFilter === s.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSpecialtyFilter(s.id)}
              className={`text-xs font-medium whitespace-nowrap gap-2 ${specialtyFilter === s.id ? "bg-secondary" : ""}`}
            >
              <s.icon className={`w-3 h-3 ${s.color}`} />
              {s.name}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-card/50 p-1 rounded-lg border border-border/50">
            {["ALL", "RED", "YELLOW", "GREEN"].map(f => (
              <Button
                key={f}
                variant={filter === f ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter(f)}
                className={`text-xs font-bold ${
                  filter === f && f === "RED" ? "bg-triage-red/20 text-triage-red hover:bg-triage-red/30" :
                  filter === f && f === "YELLOW" ? "bg-triage-yellow/20 text-triage-yellow hover:bg-triage-yellow/30" :
                  filter === f && f === "GREEN" ? "bg-triage-green/20 text-triage-green hover:bg-triage-green/30" : ""
                }`}
              >
                {f}
              </Button>
            ))}
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search ID or Name..." className="pl-9 bg-card/50" />
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-mono text-muted-foreground uppercase tracking-widest border-b border-border/50">
        <div className="col-span-1">Priority</div>
        <div className="col-span-2">ID</div>
        <div className="col-span-3">Patient</div>
        <div className="col-span-2">Specialty</div>
        <div className="col-span-1">Wait</div>
        <div className="col-span-2">Vitals Alert</div>
        <div className="col-span-1">Status</div>
      </div>

      {/* Table Body */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-2">
          {queue.map((patient) => {
            const isMine = patient.claimedBy === currentDoctor;
            const isClaimedOthers = patient.claimedBy && !isMine;
            
            return (
              <motion.div
                layoutId={patient.id}
                key={patient.id}
                onClick={() => !isClaimedOthers && setSelectedPatient(patient)}
                className={`grid grid-cols-12 gap-4 px-4 py-4 rounded-lg border cursor-pointer transition-all items-center relative overflow-hidden
                  ${selectedPatient?.id === patient.id 
                    ? "bg-primary/5 border-primary/30 shadow-md" 
                    : isMine 
                      ? "bg-green-500/5 border-green-500/20" 
                      : isClaimedOthers
                        ? "bg-muted/30 border-transparent opacity-60 cursor-not-allowed"
                        : "bg-card/30 border-border/30 hover:bg-card/50 hover:border-border/50"}`}
              >
                {isMine && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                )}
                
                <div className="col-span-1">
                  <div className={`w-3 h-3 rounded-full ${
                    patient.priority === "RED" ? "bg-triage-red animate-pulse shadow-[0_0_10px_var(--triage-red)]" :
                    patient.priority === "YELLOW" ? "bg-triage-yellow" : "bg-triage-green"
                  }`} />
                </div>
                <div className="col-span-2 font-mono font-medium flex flex-col">
                  {patient.id}
                  {isMine && <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider">YOURS</span>}
                </div>
                <div className="col-span-3">
                  <div className="font-medium">{patient.name}</div>
                  <div className="text-xs text-muted-foreground">{patient.age} yrs • {patient.symptoms[0]}</div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-background/50 border border-border/50 w-fit">
                    <SpecialtyIcon name={patient.specialty} />
                    <span className="text-xs font-medium">{patient.specialty}</span>
                  </div>
                </div>
                <div className="col-span-1 font-mono text-sm">
                  <span className={patient.priority === "RED" ? "text-triage-red font-bold" : ""}>
                    {patient.waitTime}
                  </span>
                </div>
                <div className="col-span-2 flex gap-2">
                  {patient.vitals.hr > 100 && <Badge variant="outline" className="border-triage-red text-triage-red text-[10px]">HR {patient.vitals.hr}</Badge>}
                  {patient.vitals.spo2 < 95 && <Badge variant="outline" className="border-triage-blue text-triage-blue text-[10px]">SpO2 {patient.vitals.spo2}%</Badge>}
                </div>
                <div className="col-span-1 flex justify-end">
                  {isClaimedOthers ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Claimed by {patient.claimedBy}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : isMine ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
