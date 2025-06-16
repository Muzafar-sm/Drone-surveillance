import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Bell,
  Settings,
  Map,
  BarChart2,
  Video,
  AlertTriangle,
  Wifi,
  WifiOff,
  FileVideo,
  X,
} from "lucide-react";
import AIInferencePanel from "./Dashboard/AIInferencePanel";
import MapVisualization from "./Dashboard/MapVisualization";
import AlertPanel from "./Dashboard/AlertPanel";
import AnalyticsDashboard from "./Dashboard/AnalyticsDashboard";
import DroneScannerModal from "./DronScannerModal";
import { Switch } from "@/components/ui/switch";

const Home = () => {
  const [activeTab, setActiveTab] = React.useState("live");
  const [droneConnected, setDroneConnected] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);
  const [autoConnect, setAutoConnect] = React.useState(true);
  const [alertNotifications, setAlertNotifications] = React.useState(true);
  const [videoQuality, setVideoQuality] = React.useState("HD");
  const [showAdvancedSettings, setShowAdvancedSettings] = React.useState(false);
  const [settings, setSettings] = React.useState({
    videoQuality: "HD",
    autoConnect: true,
    alertNotifications: true,
    recordingEnabled: true,
    motionDetection: true,
    nightMode: false,
    gpsTracking: true,
    dataRetention: "30 days",
    maxAltitude: 120,
    returnToHome: true
  });

  const handleDroneConnection = async () => {
    if (droneConnected) {
      // Disconnect drone
      setDroneConnected(false);
      console.log("Drone disconnected");
      return;
    }

    setIsConnecting(true);
    try {
      // Simulate drone connection process
      console.log("Attempting to connect to drone...");

      // In a real implementation, this would:
      // 1. Scan for available drones
      // 2. Establish connection via WebSocket or API
      // 3. Initialize video stream
      // 4. Set up telemetry data reception

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate connection delay

      setDroneConnected(true);
      console.log("Drone connected successfully!");

      // Switch to live feed tab when drone connects
      setActiveTab("live");
    } catch (error) {
      console.error("Failed to connect to drone:", error);
      alert(
        "Failed to connect to drone. Please check if the drone is powered on and in range.",
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectRequest = () => {
    setShowScanner(true);
  };

  const handleRealTimeVideoAnalysis = () => {
    // Scroll to the top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Switch to live tab
    setActiveTab("live");

    // Wait for smooth scroll to complete, then trigger video upload
    setTimeout(() => {
      // Trigger the video upload by simulating a click on the upload button
      const uploadButton = document.querySelector(
        "[data-upload-button]",
      ) as HTMLButtonElement;
      if (uploadButton) {
        uploadButton.click();
      }
    }, 500);
  };

  const handleSelectDrone = async (drone: any) => {
    setShowScanner(false);
    setIsConnecting(true);

    console.log(`Connecting to ${drone.name} via ${drone.protocol}...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setDroneConnected(true);
    setActiveTab("live");
    setIsConnecting(false);
  };

  const handleViewAllAlerts = () => {
    console.log("View all alerts clicked");
    setActiveTab("live");
    // In a real implementation, this would open a dedicated alerts page
  };

  const handleAutoConnectToggle = () => {
    setAutoConnect(!autoConnect);
    console.log(`Auto-connect drone: ${!autoConnect ? "enabled" : "disabled"}`);
  };

  const handleAlertNotificationsToggle = () => {
    setAlertNotifications(!alertNotifications);
    console.log(
      `Alert notifications: ${!alertNotifications ? "enabled" : "disabled"}`,
    );
  };

  const handleAlertClick = (alertType: string) => {
    console.log(`Alert clicked: ${alertType}`);
    // Switch to appropriate tab based on alert type
    if (
      alertType.includes("Fire") ||
      alertType.includes("vehicle") ||
      alertType.includes("Crowd")
    ) {
      setActiveTab("live");
    }
  };

  const handleVideoQualityChange = () => {
    const qualities = ["HD", "4K", "SD"];
    const currentIndex = qualities.indexOf(videoQuality);
    const nextQuality = qualities[(currentIndex + 1) % qualities.length];
    setVideoQuality(nextQuality);
    console.log(`Video quality changed to: ${nextQuality}`);
  };

  const handleAdvancedSettings = () => {
    setShowAdvancedSettings(true);
  };

  const handleSettingsChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">SkyGuard</h1>
            <Badge variant="secondary" className="ml-2">
              AI Surveillance
            </Badge>
            {droneConnected && (
              <Badge variant="default" className="ml-2 bg-green-500">
                <Wifi className="h-3 w-3 mr-1" />
                Drone Connected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Notifications</h4>
                  <div className="space-y-2">
                    <div
                      className="flex items-center justify-between p-2 bg-red-50 rounded-md cursor-pointer hover:bg-red-100 transition-colors"
                      onClick={() =>
                        handleAlertClick("Fire detected in Sector 7")
                      }
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">
                          Fire detected in Sector 7
                        </span>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        High
                      </Badge>
                    </div>
                    <div
                      className="flex items-center justify-between p-2 bg-yellow-50 rounded-md cursor-pointer hover:bg-yellow-100 transition-colors"
                      onClick={() =>
                        handleAlertClick("Unauthorized vehicle detected")
                      }
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">
                          Unauthorized vehicle detected
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Medium
                      </Badge>
                    </div>
                    <div
                      className="flex items-center justify-between p-2 bg-orange-50 rounded-md cursor-pointer hover:bg-orange-100 transition-colors"
                      onClick={() =>
                        handleAlertClick("Crowd formation detected")
                      }
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">
                          Crowd formation detected
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Medium
                      </Badge>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={handleViewAllAlerts}
                  >
                    View All Alerts
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-connect drone</span>
                      <Button
                        variant={autoConnect ? "default" : "outline"}
                        size="sm"
                        onClick={handleAutoConnectToggle}
                      >
                        {autoConnect ? "On" : "Off"}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Alert notifications</span>
                      <Button
                        variant={alertNotifications ? "default" : "outline"}
                        size="sm"
                        onClick={handleAlertNotificationsToggle}
                      >
                        {alertNotifications ? "On" : "Off"}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Video quality</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleVideoQualityChange}
                      >
                        {videoQuality}
                      </Button>
                    </div>
                    <Separator />
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={handleAdvancedSettings}
                    >
                      Advanced Settings
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant={droneConnected ? "destructive" : "default"}
              onClick={droneConnected ? handleDroneConnection : handleConnectRequest}
              disabled={isConnecting}
              className="flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Connecting...
                </>
              ) : droneConnected ? (
                <>
                  <WifiOff className="h-4 w-4" />
                  Disconnect Drone
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4" />
                  Connect Drone
                </>
              )}
            </Button>
            <DroneScannerModal
              open={showScanner}
              onClose={() => setShowScanner(false)}
              onConnect={handleSelectDrone}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <Tabs
          defaultValue="live"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="live">
                <Video className="mr-2 h-4 w-4" />
                Live Feed
              </TabsTrigger>
              <TabsTrigger value="map">
                <Map className="mr-2 h-4 w-4" />
                Map View
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart2 className="mr-2 h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="flex items-center">
                <AlertTriangle className="mr-1 h-3 w-3" />3 Active Alerts
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Main Content Area */}
            <div className="md:col-span-3">
              <div className="space-y-4" style={{ display: activeTab === "live" ? "block" : "none" }}>
                <Card>
                  <CardHeader>
                    <CardTitle>AI Inference Panel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AIInferencePanel />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4" style={{ display: activeTab === "map" ? "block" : "none" }}>
                <Card>
                  <CardHeader>
                    <CardTitle>3D Map Visualization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MapVisualization />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4" style={{ display: activeTab === "analytics" ? "block" : "none" }}>
                <Card>
                  <CardHeader>
                    <CardTitle>System Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AnalyticsDashboard />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Alert System</CardTitle>
                </CardHeader>
                <CardContent>
                  <AlertPanel />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Model Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Object Detection
                      </h4>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        facebook/detr-resnet-50
                      </Button>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Depth Estimation
                      </h4>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        damo/cv_resnet_depth-estimation
                      </Button>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Video Classification
                      </h4>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        MCG-NJU/videomae-base
                      </Button>
                    </div>
                    <Separator />
                    <div className="pt-2">
                      <Link to="/">
                        <Button 
                          variant="default" 
                          onClick={handleRealTimeVideoAnalysis}
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <FileVideo className="h-4 w-4" />
                          Real-time Video Analysis
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </main>

      {showAdvancedSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg w-[600px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Advanced Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAdvancedSettings(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video Quality</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={settings.videoQuality}
                    onChange={(e) => handleSettingsChange('videoQuality', e.target.value)}
                  >
                    <option value="SD">SD</option>
                    <option value="HD">HD</option>
                    <option value="4K">4K</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Retention</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={settings.dataRetention}
                    onChange={(e) => handleSettingsChange('dataRetention', e.target.value)}
                  >
                    <option value="7 days">7 days</option>
                    <option value="30 days">30 days</option>
                    <option value="90 days">90 days</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Altitude (meters)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md"
                    value={settings.maxAltitude}
                    onChange={(e) => handleSettingsChange('maxAltitude', parseInt(e.target.value))}
                    min="0"
                    max="400"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto-connect Drone</label>
                    <p className="text-sm text-muted-foreground">Automatically connect to drone on startup</p>
                  </div>
                  <Switch
                    checked={settings.autoConnect}
                    onCheckedChange={(checked) => handleSettingsChange('autoConnect', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Alert Notifications</label>
                    <p className="text-sm text-muted-foreground">Receive notifications for detected events</p>
                  </div>
                  <Switch
                    checked={settings.alertNotifications}
                    onCheckedChange={(checked) => handleSettingsChange('alertNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Recording</label>
                    <p className="text-sm text-muted-foreground">Enable automatic video recording</p>
                  </div>
                  <Switch
                    checked={settings.recordingEnabled}
                    onCheckedChange={(checked) => handleSettingsChange('recordingEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Motion Detection</label>
                    <p className="text-sm text-muted-foreground">Enable AI motion detection</p>
                  </div>
                  <Switch
                    checked={settings.motionDetection}
                    onCheckedChange={(checked) => handleSettingsChange('motionDetection', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Night Mode</label>
                    <p className="text-sm text-muted-foreground">Enable night vision capabilities</p>
                  </div>
                  <Switch
                    checked={settings.nightMode}
                    onCheckedChange={(checked) => handleSettingsChange('nightMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">GPS Tracking</label>
                    <p className="text-sm text-muted-foreground">Enable GPS location tracking</p>
                  </div>
                  <Switch
                    checked={settings.gpsTracking}
                    onCheckedChange={(checked) => handleSettingsChange('gpsTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Return to Home</label>
                    <p className="text-sm text-muted-foreground">Enable automatic return to home on low battery</p>
                  </div>
                  <Switch
                    checked={settings.returnToHome}
                    onCheckedChange={(checked) => handleSettingsChange('returnToHome', checked)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedSettings(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Save settings
                    console.log('Saving settings:', settings);
                    setShowAdvancedSettings(false);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
