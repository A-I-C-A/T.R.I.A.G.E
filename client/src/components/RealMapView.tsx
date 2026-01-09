import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertOctagon, Building2 } from 'lucide-react';
import { Badge } from './ui/badge';

// Fix for default marker icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Hyderabad coordinates (default center)
const DEFAULT_CENTER: [number, number] = [17.385044, 78.486671];
const DEFAULT_ZOOM = 12;

interface Hospital {
  id: number;
  name: string;
  location: string;
  occupancy: number;
  status: 'NORMAL' | 'BUSY' | 'CRITICAL';
  total_beds: number;
  available_beds: number;
  waiting_patients?: number;
  surge?: boolean;
}

interface RealMapViewProps {
  hospitals: Hospital[];
  onHospitalClick?: (hospital: Hospital) => void;
}

export function RealMapView({ hospitals, onHospitalClick }: RealMapViewProps) {
  // Custom marker icons based on status
  const getMarkerIcon = (status: string) => {
    const color = status === 'CRITICAL' ? 'red' : status === 'BUSY' ? 'orange' : 'green';
    
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
          <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">H</text>
        </svg>
      `)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  // Generate random coordinates around Hyderabad for hospitals
  // In a real app, you'd geocode the hospital.location string
  const getHospitalCoordinates = (hospital: Hospital, index: number): [number, number] => {
    // Seed randomness based on hospital ID for consistency
    const seed = hospital.id || index;
    const random1 = (Math.sin(seed * 12.9898) * 43758.5453) % 1;
    const random2 = (Math.cos(seed * 78.233) * 43758.5453) % 1;
    
    // Spread hospitals within ~10km radius of Hyderabad center
    const latOffset = (Math.abs(random1) - 0.5) * 0.15; // ~15km
    const lngOffset = (Math.abs(random2) - 0.5) * 0.15;
    
    return [
      DEFAULT_CENTER[0] + latOffset,
      DEFAULT_CENTER[1] + lngOffset
    ];
  };

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      className="z-0"
    >
      {/* OpenStreetMap Tiles - Free and open source */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Hospital Markers */}
      {hospitals.map((hospital, index) => {
        const position = getHospitalCoordinates(hospital, index);
        
        return (
          <Marker
            key={hospital.id || index}
            position={position}
            icon={getMarkerIcon(hospital.status)}
            eventHandlers={{
              click: () => onHospitalClick?.(hospital)
            }}
          >
            <Popup className="hospital-popup">
              <div className="p-2 min-w-[200px]">
                <div className="flex items-start gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{hospital.name}</h3>
                    <p className="text-xs text-muted-foreground">{hospital.location}</p>
                  </div>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={`text-xs ${
                      hospital.status === 'CRITICAL' ? 'bg-triage-red' :
                      hospital.status === 'BUSY' ? 'bg-triage-yellow text-black' :
                      'bg-triage-green'
                    }`}>
                      {hospital.status}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Occupancy:</span>
                    <span className="font-bold">{hospital.occupancy}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Beds:</span>
                    <span className="font-bold">{hospital.available_beds}/{hospital.total_beds}</span>
                  </div>
                  
                  {hospital.waiting_patients !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Waiting:</span>
                      <span className="font-bold">{hospital.waiting_patients}</span>
                    </div>
                  )}
                  
                  {hospital.surge && (
                    <div className="flex items-center gap-1 text-triage-red mt-2 pt-2 border-t">
                      <AlertOctagon className="w-3 h-3" />
                      <span className="font-bold text-xs">SURGE DETECTED</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
