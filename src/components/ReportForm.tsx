import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useOfflineStore } from '@/stores/offlineStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, MapPin, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { Map } from './Map';
import { useToast } from '@/hooks/use-toast';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address: string;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

export const ReportForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addPendingReport, isOnline } = useOfflineStore();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    hazard_type: '',
    severity: '',
    urgency_level: 'medium',
    description: '',
    location_description: '',
    reporter_name: '',
    reporter_contact: '',
  });

  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    address: '',
    accuracy: null,
    loading: false,
    error: null,
  });

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const hazardTypes = [
    'Tsunami', 'Cyclone', 'Storm Surge', 'High Waves', 'Rip Current',
    'Coastal Erosion', 'Oil Spill', 'Marine Pollution', 'Jellyfish Bloom',
    'Red Tide', 'Fish Kill', 'Coral Bleaching', 'Extreme Weather',
    'Flooding', 'Other'
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', description: 'Minimal impact' },
    { value: 'medium', label: 'Medium', description: 'Moderate impact' },
    { value: 'high', label: 'High', description: 'Significant impact' },
    { value: 'critical', label: 'Critical', description: 'Severe impact' },
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low', description: 'Can wait hours/days' },
    { value: 'medium', label: 'Medium', description: 'Needs attention soon' },
    { value: 'high', label: 'High', description: 'Urgent attention needed' },
    { value: 'critical', label: 'Critical', description: 'Immediate action required' },
  ];

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFormData(prev => ({
        ...prev,
        reporter_name: user.user_metadata.full_name,
        reporter_contact: user.email || '',
      }));
    }
  }, [user]);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, error: 'Geolocation is not supported' }));
      return;
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }));

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        try {
          // Reverse geocoding to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          setLocation({
            latitude,
            longitude,
            address,
            accuracy,
            loading: false,
            error: null,
          });

          setFormData(prev => ({
            ...prev,
            location_description: address,
          }));

        } catch (error) {
          console.error('Geocoding error:', error);
          const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setLocation({
            latitude,
            longitude,
            address,
            accuracy,
            loading: false,
            error: null,
          });
          setFormData(prev => ({
            ...prev,
            location_description: address,
          }));
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
      },
      options
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isNotTooLarge = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValid && isNotTooLarge;
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "File Upload Warning",
        description: "Some files were skipped. Only images and videos under 10MB are allowed.",
        variant: "destructive",
      });
    }

    setMediaFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.hazard_type || !formData.severity || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!location.latitude || !location.longitude) {
      toast({
        title: "Location Required",
        description: "Please get your current location before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      await addPendingReport({
        latitude: location.latitude,
        longitude: location.longitude,
        description: formData.description,
        severity: formData.severity,
        hazard_type: formData.hazard_type,
        location_description: formData.location_description,
        reporter_name: formData.reporter_name,
        reporter_contact: formData.reporter_contact,
        urgency_level: formData.urgency_level,
        media_files: mediaFiles,
      });

      toast({
        title: "Report Submitted",
        description: isOnline 
          ? "Your report has been submitted and will be reviewed." 
          : "Your report has been saved offline and will sync when connection is restored.",
      });

      // Reset form
      setFormData({
        hazard_type: '',
        severity: '',
        urgency_level: 'medium',
        description: '',
        location_description: '',
        reporter_name: user?.user_metadata?.full_name || '',
        reporter_contact: user?.email || '',
      });
      setMediaFiles([]);
      
      navigate('/');
      
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Report Ocean Hazard
          </CardTitle>
          <CardDescription>
            Help protect coastal communities by reporting ocean hazards and dangerous conditions.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Connection Status */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {isOnline 
                  ? "You're online. Reports will be submitted immediately."
                  : "You're offline. Reports will be saved locally and synced when connection is restored."
                }
              </AlertDescription>
            </Alert>

            {/* Location Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Location</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={location.loading}
                >
                  {location.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <MapPin className="w-4 h-4 mr-2" />
                  )}
                  Get Current Location
                </Button>
              </div>

              {location.error && (
                <Alert variant="destructive">
                  <AlertDescription>{location.error}</AlertDescription>
                </Alert>
              )}

              {location.latitude && location.longitude && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      <MapPin className="w-3 h-3 mr-1" />
                      Location acquired
                    </Badge>
                    {location.accuracy && (
                      <Badge variant="outline">
                        ±{Math.round(location.accuracy)}m accuracy
                      </Badge>
                    )}
                  </div>
                  
                  <Map
                    center={[location.latitude, location.longitude]}
                    zoom={15}
                    height="200px"
                    showReports={false}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="location_description">Location Description</Label>
                <Input
                  id="location_description"
                  value={formData.location_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_description: e.target.value }))}
                  placeholder="Describe the specific location"
                />
              </div>
            </div>

            {/* Hazard Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hazard_type">Hazard Type *</Label>
                <Select value={formData.hazard_type} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, hazard_type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hazard type" />
                  </SelectTrigger>
                  <SelectContent>
                    {hazardTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select value={formData.severity} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, severity: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label} - {level.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency_level">Urgency Level</Label>
              <Select value={formData.urgency_level} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, urgency_level: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label} - {level.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the hazard in detail. Include what you observed, when it occurred, and any immediate impacts..."
                rows={4}
                required
              />
            </div>

            {/* Media Upload */}
            <div className="space-y-4">
              <Label>Media Files (Photos/Videos)</Label>
              
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload" className="cursor-pointer">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to add photos or videos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 5 files, 10MB each
                  </p>
                </label>
              </div>

              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {mediaFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-center">
                            <Upload className="w-8 h-8 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground truncate">
                              {file.name}
                            </p>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reporter Information */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Reporter Information</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reporter_name">Name</Label>
                  <Input
                    id="reporter_name"
                    value={formData.reporter_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, reporter_name: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reporter_contact">Contact (Optional)</Label>
                  <Input
                    id="reporter_contact"
                    type="email"
                    value={formData.reporter_contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, reporter_contact: e.target.value }))}
                    placeholder="Email or phone number"
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting || (!location.latitude || !location.longitude)}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <AlertTriangle className="w-4 h-4 mr-2" />
              )}
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};