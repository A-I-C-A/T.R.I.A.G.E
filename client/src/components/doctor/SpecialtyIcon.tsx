import { Stethoscope } from "lucide-react";
import { SPECIALTIES } from "./constants";

interface SpecialtyIconProps {
  name: string;
  className?: string;
}

export function SpecialtyIcon({ name, className }: SpecialtyIconProps) {
  const s = SPECIALTIES.find(s => s.id === name);
  const Icon = s?.icon || Stethoscope;
  const color = s?.color || "text-muted-foreground";
  return <Icon className={`${className || "w-3 h-3"} ${color}`} />;
}
