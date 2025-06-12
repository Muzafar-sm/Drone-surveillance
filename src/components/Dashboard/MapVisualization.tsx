import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Layers,
  MapPin,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";

interface MapVisualizationProps {
  droneLocation?: { lat: number; lng: number; alt: number };
  coverageRadius?: number;
  hazardData?: Array<{
    id: string;
    position: { lat: number; lng: number };
    type: string;
    confidence: number;
    timestamp: string;
  }>;
}

const MapVisualization: React.FC<MapVisualizationProps> = ({
  droneLocation = { lat: 37.7749, lng: -122.4194, alt: 150 },
  coverageRadius = 500,
  hazardData = [
    {
      id: "hazard-1",
      position: { lat: 37.7739, lng: -122.4184 },
      type: "fire",
      confidence: 0.89,
      timestamp: new Date().toISOString(),
    },
    {
      id: "hazard-2",
      position: { lat: 37.7759, lng: -122.4204 },
      type: "unauthorized_vehicle",
      confidence: 0.76,
      timestamp: new Date().toISOString(),
    },
    {
      id: "hazard-3",
      position: { lat: 37.7769, lng: -122.4174 },
      type: "crowd",
      confidence: 0.92,
      timestamp: new Date().toISOString(),
    },
  ],
}: MapVisualizationProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState("3d");
  const [layerVisibility, setLayerVisibility] = useState({
    drone: true,
    coverage: true,
    hazards: true,
    terrain: true,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [opacityValue, setOpacityValue] = useState([75]);
  const [mapPosition, setMapPosition] = useState({ x: 50, y: 50 });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPosition, setLastPosition] = useState({ x: 50, y: 50 });

  // Enhanced map initialization with interactive elements
  useEffect(() => {
    console.log("Initializing enhanced map with:", {
      droneLocation,
      coverageRadius,
      hazardData,
      activeView,
      layerVisibility,
    });

    // Enhanced map rendering with interactive elements
    if (mapContainerRef.current) {
      const mapContainer = mapContainerRef.current;
      mapContainer.innerHTML = "";

      // Create main map container
      const mapElement = document.createElement("div");
      mapElement.className =
        "w-full h-full relative overflow-hidden rounded-md cursor-grab";

      // Create background map image
      const mapBackground = document.createElement("div");
      mapBackground.className =
        "w-full h-full bg-gradient-to-br from-blue-900 via-blue-800 to-green-800 transition-all duration-100";
      mapBackground.style.backgroundImage = `url('https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200&q=80')`;
      mapBackground.style.backgroundSize = `${zoomLevel}%`;
      mapBackground.style.backgroundPosition = `${mapPosition.x}% ${mapPosition.y}%`;
      mapBackground.style.backgroundRepeat = "no-repeat";

      // Add mouse event listeners for drag functionality
      const handleMouseDown = (e: MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setLastPosition(mapPosition);
        mapElement.style.cursor = "grabbing";
        e.preventDefault();
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const deltaX = (e.clientX - dragStart.x) * 0.1;
        const deltaY = (e.clientY - dragStart.y) * 0.1;

        const newX = Math.max(0, Math.min(100, lastPosition.x - deltaX));
        const newY = Math.max(0, Math.min(100, lastPosition.y - deltaY));

        setMapPosition({ x: newX, y: newY });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        mapElement.style.cursor = "grab";
      };

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const zoomDelta = e.deltaY > 0 ? -10 : 10;
        const newZoom = Math.max(50, Math.min(200, zoomLevel + zoomDelta));
        setZoomLevel(newZoom);
      };

      // Add event listeners
      mapElement.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      mapElement.addEventListener("wheel", handleWheel);

      // Cleanup function for event listeners
      const cleanup = () => {
        mapElement.removeEventListener("mousedown", handleMouseDown);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        mapElement.removeEventListener("wheel", handleWheel);
      };

      // Store cleanup function
      (mapElement as any).cleanup = cleanup;

      // Create overlay for map elements
      const overlay = document.createElement("div");
      overlay.className = "absolute inset-0";

      // Add drone marker
      if (layerVisibility.drone) {
        const droneMarker = document.createElement("div");
        droneMarker.className =
          "absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 animate-pulse";
        droneMarker.style.left = "50%";
        droneMarker.style.top = "40%";
        droneMarker.innerHTML = `<div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Drone: Alt ${droneLocation.alt}m</div>`;
        overlay.appendChild(droneMarker);
      }

      // Add coverage area
      if (layerVisibility.coverage) {
        const coverageArea = document.createElement("div");
        coverageArea.className =
          "absolute border-2 border-blue-400 border-dashed rounded-full transform -translate-x-1/2 -translate-y-1/2";
        coverageArea.style.left = "50%";
        coverageArea.style.top = "40%";
        coverageArea.style.width = "200px";
        coverageArea.style.height = "200px";
        coverageArea.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
        overlay.appendChild(coverageArea);
      }

      // Add hazard markers
      if (layerVisibility.hazards) {
        hazardData.forEach((hazard, index) => {
          const hazardMarker = document.createElement("div");
          const colors = {
            fire: "bg-red-500",
            unauthorized_vehicle: "bg-yellow-500",
            crowd: "bg-orange-500",
          };

          // Calculate responsive position based on map state
          const baseX = 30 + index * 15; // Base percentage position
          const baseY = 60 + index * 10; // Base percentage position

          // Adjust position based on map pan and zoom
          const zoomFactor = zoomLevel / 100;
          const panOffsetX = (mapPosition.x - 50) * 0.5; // Reduce pan sensitivity
          const panOffsetY = (mapPosition.y - 50) * 0.5;

          const adjustedX = baseX + panOffsetX;
          const adjustedY = baseY + panOffsetY;

          // Scale marker size based on zoom
          const markerSize = Math.max(12, Math.min(24, 16 * zoomFactor));

          hazardMarker.className = `absolute rounded-full border border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 animate-bounce ${colors[hazard.type as keyof typeof colors] || "bg-red-500"}`;
          hazardMarker.style.width = `${markerSize}px`;
          hazardMarker.style.height = `${markerSize}px`;
          hazardMarker.style.left = `${Math.max(5, Math.min(95, adjustedX))}%`;
          hazardMarker.style.top = `${Math.max(5, Math.min(95, adjustedY))}%`;
          hazardMarker.innerHTML = `<div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded whitespace-nowrap" style="font-size: ${Math.max(10, Math.min(14, 12 * zoomFactor))}px">${hazard.type}: ${Math.round(hazard.confidence * 100)}%</div>`;
          overlay.appendChild(hazardMarker);
        });
      }

      // Add terrain grid if enabled
      if (layerVisibility.terrain) {
        const grid = document.createElement("div");
        grid.className = "absolute inset-0 opacity-20";
        grid.style.backgroundImage = `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `;
        grid.style.backgroundSize = "50px 50px";
        overlay.appendChild(grid);
      }

      // Add heatmap overlay
      const heatmapOverlay = document.createElement("div");
      heatmapOverlay.className = "absolute inset-0 pointer-events-none";
      heatmapOverlay.style.background = `radial-gradient(circle at 30% 60%, rgba(255,0,0,${opacityValue[0] / 200}) 0%, transparent 30%), radial-gradient(circle at 45% 70%, rgba(255,165,0,${opacityValue[0] / 300}) 0%, transparent 25%)`;
      overlay.appendChild(heatmapOverlay);

      // Add info panel
      const infoPanel = document.createElement("div");
      infoPanel.className =
        "absolute bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-sm";
      infoPanel.innerHTML = `
        <div class="font-bold mb-1">${activeView.toUpperCase()} View</div>
        <div>Lat: ${droneLocation.lat.toFixed(4)}</div>
        <div>Lng: ${droneLocation.lng.toFixed(4)}</div>
        <div>Hazards: ${hazardData.length}</div>
        <div>Coverage: ${coverageRadius}m</div>
      `;
      overlay.appendChild(infoPanel);

      mapElement.appendChild(mapBackground);
      mapElement.appendChild(overlay);
      mapContainer.appendChild(mapElement);
    }

    // Cleanup function
    return () => {
      console.log("Cleaning up enhanced map");
      if (mapContainerRef.current) {
        const mapElement = mapContainerRef.current.querySelector(
          ".w-full.h-full.relative",
        ) as any;
        if (mapElement && mapElement.cleanup) {
          mapElement.cleanup();
        }
      }
    };
  }, [
    droneLocation,
    coverageRadius,
    hazardData,
    activeView,
    layerVisibility,
    opacityValue,
    mapPosition,
    zoomLevel,
    isDragging,
    dragStart,
    lastPosition,
  ]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleLayerVisibility = (layer: keyof typeof layerVisibility) => {
    setLayerVisibility({
      ...layerVisibility,
      [layer]: !layerVisibility[layer],
    });
  };

  const resetView = () => {
    setMapPosition({ x: 50, y: 50 });
    setZoomLevel(100);
    console.log("Resetting map view");
  };

  return (
    <Card
      className={`bg-background ${isFullscreen ? "fixed inset-0 z-50" : "w-full"}`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">3D Visualization</CardTitle>
        <div className="flex items-center space-x-2">
          <Tabs
            value={activeView}
            onValueChange={setActiveView}
            className="mr-4"
          >
            <TabsList>
              <TabsTrigger value="3d">3D</TabsTrigger>
              <TabsTrigger value="2d">2D</TabsTrigger>
              <TabsTrigger value="satellite">Satellite</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={resetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex h-[400px]">
          <div className="w-full h-full relative">
            <div
              ref={mapContainerRef}
              className="w-full h-full bg-slate-900 rounded-md"
            />
            <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-3 rounded-lg shadow-lg">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="drone-layer"
                    className="cursor-pointer flex items-center"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Drone
                  </Label>
                  <Switch
                    id="drone-layer"
                    checked={layerVisibility.drone}
                    onCheckedChange={() => toggleLayerVisibility("drone")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="coverage-layer"
                    className="cursor-pointer flex items-center"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Coverage
                  </Label>
                  <Switch
                    id="coverage-layer"
                    checked={layerVisibility.coverage}
                    onCheckedChange={() => toggleLayerVisibility("coverage")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="hazards-layer"
                    className="cursor-pointer flex items-center"
                  >
                    {layerVisibility.hazards ? (
                      <Eye className="h-4 w-4 mr-2" />
                    ) : (
                      <EyeOff className="h-4 w-4 mr-2" />
                    )}
                    Hazards
                  </Label>
                  <Switch
                    id="hazards-layer"
                    checked={layerVisibility.hazards}
                    onCheckedChange={() => toggleLayerVisibility("hazards")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="terrain-layer"
                    className="cursor-pointer flex items-center"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Terrain
                  </Label>
                  <Switch
                    id="terrain-layer"
                    checked={layerVisibility.terrain}
                    onCheckedChange={() => toggleLayerVisibility("terrain")}
                  />
                </div>
                <div className="pt-2">
                  <Label
                    htmlFor="opacity-slider"
                    className="text-xs text-muted-foreground mb-1 block"
                  >
                    Heatmap Opacity: {opacityValue}%
                  </Label>
                  <Slider
                    id="opacity-slider"
                    value={opacityValue}
                    onValueChange={setOpacityValue}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="pt-2">
                  <Label
                    htmlFor="zoom-slider"
                    className="text-xs text-muted-foreground mb-1 block"
                  >
                    Zoom: {zoomLevel}%
                  </Label>
                  <Slider
                    id="zoom-slider"
                    value={[zoomLevel]}
                    onValueChange={(value) => setZoomLevel(value[0])}
                    min={50}
                    max={200}
                    step={10}
                  />
                </div>
                <div className="pt-2 text-xs text-muted-foreground">
                  <div>Drag to pan</div>
                  <div>Scroll to zoom</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapVisualization;
