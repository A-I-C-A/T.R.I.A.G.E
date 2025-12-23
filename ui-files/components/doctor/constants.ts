import { 
  AlertTriangle, 
  Heart, 
  Wind, 
  Brain, 
  Stethoscope 
} from "lucide-react";

export const SPECIALTIES = [
  { id: "Trauma", name: "Emergency / Trauma", icon: AlertTriangle, color: "text-orange-500" },
  { id: "Cardiology", name: "Cardiology", icon: Heart, color: "text-red-500" },
  { id: "Pulmonology", name: "Pulmonology", icon: Wind, color: "text-blue-500" },
  { id: "Neurology", name: "Neurology", icon: Brain, color: "text-purple-500" },
  { id: "General", name: "General Medicine", icon: Stethoscope, color: "text-green-500" },
];

export const INITIAL_QUEUE = [
  { id: "P-1024", name: "John Doe", age: 45, priority: "RED", waitTime: "00:05", vitals: { hr: 125, spo2: 88 }, symptoms: ["Chest Pain", "Sweating"], specialty: "Cardiology", claimedBy: null },
  { id: "P-1025", name: "Jane Smith", age: 28, priority: "YELLOW", waitTime: "00:15", vitals: { hr: 98, spo2: 96 }, symptoms: ["Abdominal Pain"], specialty: "General", claimedBy: null },
  { id: "P-1026", name: "Robert Brown", age: 62, priority: "YELLOW", waitTime: "00:22", vitals: { hr: 85, spo2: 95 }, symptoms: ["Dizziness"], specialty: "Neurology", claimedBy: "Dr. House" },
  { id: "P-1027", name: "Emily Davis", age: 34, priority: "GREEN", waitTime: "00:45", vitals: { hr: 72, spo2: 99 }, symptoms: ["Minor Cut"], specialty: "Trauma", claimedBy: null },
  { id: "P-1028", name: "Michael Wilson", age: 55, priority: "RED", waitTime: "00:02", vitals: { hr: 140, spo2: 92 }, symptoms: ["Trauma"], specialty: "Trauma", claimedBy: null },
  { id: "P-1029", name: "Sarah Miller", age: 19, priority: "GREEN", waitTime: "01:10", vitals: { hr: 68, spo2: 98 }, symptoms: ["Headache"], specialty: "Neurology", claimedBy: null },
];
