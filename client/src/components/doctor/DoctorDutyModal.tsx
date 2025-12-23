import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SPECIALTIES } from "./constants";

interface DoctorDutyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (specialtyId: string) => void;
  queue: any[];
}

export function DoctorDutyModal({ open, onOpenChange, onSelect, queue }: DoctorDutyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">Select Your Duty Focus</DialogTitle>
          <DialogDescription className="text-lg">Filter the queue to what matters most right now.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
          {SPECIALTIES.map((s) => (
            <div 
              key={s.id}
              onClick={() => onSelect(s.id)}
              className="group cursor-pointer p-6 rounded-xl border border-border/50 bg-card/50 hover:bg-primary/5 hover:border-primary/50 transition-all flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-lg bg-background/50 ${s.color} bg-opacity-10`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                {queue.filter(p => p.specialty === s.id && p.priority === "RED").length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {queue.filter(p => p.specialty === s.id && p.priority === "RED").length} CRITICAL
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">{s.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {queue.filter(p => p.specialty === s.id).length} Patients Waiting
                </p>
              </div>
            </div>
          ))}
          <div 
            onClick={() => onSelect("ALL")}
            className="group cursor-pointer p-6 rounded-xl border border-border/50 bg-card/50 hover:bg-primary/5 hover:border-primary/50 transition-all flex flex-col gap-4 justify-center items-center text-center"
          >
            <Activity className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            <div>
              <h3 className="font-bold text-lg">View All</h3>
              <p className="text-sm text-muted-foreground">Monitor entire emergency floor</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
