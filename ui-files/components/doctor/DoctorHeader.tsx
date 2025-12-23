import { Activity, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SPECIALTIES } from "./constants";
import { useNavigate } from "react-router";

interface DoctorHeaderProps {
  onOpenDutyModal: () => void;
  dutyFocus: string | null;
  myActivePatients: number;
  onResetFilters: () => void;
}

export function DoctorHeader({ onOpenDutyModal, dutyFocus, myActivePatients, onResetFilters }: DoctorHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-border/50 glass-panel flex items-center justify-between px-6 z-20">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg cursor-pointer" onClick={onOpenDutyModal}>
          <Activity className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-bold tracking-tight text-lg">EMERGENCY QUEUE</h1>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground font-mono">DR. SMITH • ON DUTY</p>
            {dutyFocus && dutyFocus !== "ALL" && (
              <Badge variant="outline" className="text-[10px] h-4 px-1 border-primary/30 text-primary">
                {SPECIALTIES.find(s => s.id === dutyFocus)?.name}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="hidden md:flex gap-2 bg-primary/5 hover:bg-primary/10"
          onClick={onResetFilters}
        >
          <User className="w-4 h-4" />
          <span>Your Active Patients: {myActivePatients}</span>
        </Button>
        <div className="h-8 w-px bg-border/50 mx-2" />
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
