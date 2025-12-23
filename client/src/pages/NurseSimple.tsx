import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { patientAPI } from "@/services/api";

export default function NurseViewSimple() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientAge) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await patientAPI.createPatient({
        name: patientName,
        age: Number(patientAge),
        gender: "Male",
        symptoms: ["General"],
        riskFactors: [],
        vitals: {},
        recommendedSpecialty: "General",
        hospitalId: user?.hospitalId || '1'
      });

      toast.success("Patient created successfully!");
      setPatientName("");
      setPatientAge("");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to create patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Nurse Dashboard</h1>
          <Button variant="outline" onClick={() => { logout(); navigate("/auth"); }}>
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register New Patient</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Patient Name</Label>
                <Input
                  id="name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="Enter age"
                  required
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Creating..." : "Create Patient"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>Logged in as: {user?.email}</p>
        </div>
      </div>
    </div>
  );
}
