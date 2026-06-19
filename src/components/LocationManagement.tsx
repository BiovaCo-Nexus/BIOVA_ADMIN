"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Save, Edit } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface LocationData {
  id: number
  latitude: number
  longitude: number
  address: string
  city: string
  state: string
  country: string
  postal_code?: string
}

export function LocationManagement() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    latitude: "",
    longitude: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchLocation()
  }, [])

  const fetchLocation = async () => {
    try {
      const { data, error } = await supabase.from("contact_location").select("*").eq("is_active", true).maybeSingle()

      if (error) {
        console.error("Error fetching location:", error)
      } else {
        setLocation(data)
        setFormData({
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString(),
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          postal_code: data.postal_code || "",
        })
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const latitude = Number.parseFloat(formData.latitude)
      const longitude = Number.parseFloat(formData.longitude)

      if (isNaN(latitude) || isNaN(longitude)) {
        toast({
          title: "Invalid Coordinates",
          description: "Please enter valid latitude and longitude values",
          variant: "destructive",
        })
        return
      }

      if (location) {
        // Update existing location
        const { error } = await supabase
          .from("contact_location")
          .update({
            latitude,
            longitude,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            postal_code: formData.postal_code || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", location.id)

        if (error) throw error
      } else {
        // Create new location
        const { error } = await supabase.from("contact_location").insert({
          latitude,
          longitude,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postal_code: formData.postal_code || null,
        })

        if (error) throw error
      }

      toast({
        title: "Location Updated",
        description: "Contact location has been updated successfully",
      })

      setIsEditing(false)
      fetchLocation()
    } catch (error: any) {
      console.error("Error saving location:", error)
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save location",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-green-300" style={{ backgroundColor: "#E6F2E6" }}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2" style={{ color: "#222222" }}>
          <MapPin className="h-5 w-5 text-green-600" />
          <span>Contact Location Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEditing ? (
          <div className="space-y-3">
            {location && (
              <>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#222222" }}>
                    Current Location:
                  </p>
                  <p className="text-sm" style={{ color: "#444444" }}>
                    {location.address}
                  </p>
                  <p className="text-sm" style={{ color: "#444444" }}>
                    {location.city}, {location.state} {location.postal_code}
                  </p>
                  <p className="text-sm" style={{ color: "#444444" }}>
                    Coordinates: {location.latitude}, {location.longitude}
                  </p>
                </div>
                <div className="h-32 bg-green-100 rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dO_BDw2PcQSqDg&q=${location.latitude},${location.longitude}&zoom=15`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    title="Current Location Preview"
                  />
                </div>
              </>
            )}
            <Button onClick={() => setIsEditing(true)} className="bg-green-600 hover:bg-green-700 text-white">
              <Edit className="h-4 w-4 mr-2" />
              Edit Location
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange("latitude", e.target.value)}
                  placeholder="21.1458"
                  className="border-green-400 focus:border-green-600"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange("longitude", e.target.value)}
                  placeholder="79.0882"
                  className="border-green-400 focus:border-green-600"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="RCOEM TBI Office, Near RBU, Gittikhadhan"
                className="border-green-400 focus:border-green-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Nagpur"
                  className="border-green-400 focus:border-green-600"
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="Maharashtra"
                  className="border-green-400 focus:border-green-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  placeholder="India"
                  className="border-green-400 focus:border-green-600"
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange("postal_code", e.target.value)}
                  placeholder="440013"
                  className="border-green-400 focus:border-green-600"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Location"}
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="w-full sm:w-auto border-green-600 text-green-600 hover:bg-green-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
