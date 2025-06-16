import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Maximize2,
  Minimize2,
  Upload,
  Video,
  X,
} from "lucide-react";

interface AIInferencePanelProps {
  videoFeed?: string;
  detections?: Detection[];
  isLive?: boolean;
  currentModel?: string;
  confidenceThreshold?: number;
}

interface Detection {
  id: string;
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  severity: "low" | "medium" | "high";
  timestamp: string;
  frame_number?: number;
  fps?: number;
}

const AIInferencePanel: React.FC<AIInferencePanelProps> = ({
  videoFeed = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
  isLive = true,
  currentModel = "facebook/detr-resnet-50",
  confidenceThreshold = 0.85,
}) => {
  const [isPlaying, setIsPlaying] = useState(isLive);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showConfidenceScores, setShowConfidenceScores] = useState(true);
  const [threshold, setThreshold] = useState(confidenceThreshold);
  const [selectedModel, setSelectedModel] = useState(currentModel);
  const [excludedLabels, setExcludedLabels] = useState<string[]>([]);
  const [visualizationMode, setVisualizationMode] = useState("bounding-boxes");
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<"live" | "uploaded">("live");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 1, height: 1 });
  const [detections, setDetections] = useState<Detection[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [videoFps, setVideoFps] = useState(30); // Default FPS
  const [hasProcessedVideo, setHasProcessedVideo] = useState(false);

  // Update video dimensions when video metadata is loaded
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleLoadedMetadata = () => {
      setVideoDimensions({
        width: video.videoWidth || 1,
        height: video.videoHeight || 1,
      });
    };
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [uploadedVideo]);

  // Ensure video plays/pauses according to isPlaying
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, uploadedVideo]);

  // Get displayed video size
  const [displaySize, setDisplaySize] = useState({ width: 1, height: 1 });
  useEffect(() => {
    const updateSize = () => {
      const video = videoRef.current;
      if (video) {
        setDisplaySize({
          width: video.clientWidth || 1,
          height: video.clientHeight || 1,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [uploadedVideo, isFullscreen]);

  // Scale bounding box coordinates
  const scaleBox = (box: { x: number; y: number; width: number; height: number }) => {
    if (!videoDimensions || !videoDimensions.width || !videoDimensions.height) {
      return {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      };
    }
    const scaleX = displaySize.width / videoDimensions.width;
    const scaleY = displaySize.height / videoDimensions.height;
    return {
      left: box.x * scaleX,
      top: box.y * scaleY,
      width: box.width * scaleX,
      height: box.height * scaleY,
    };
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleThresholdChange = (value: number[]) => {
    setThreshold(value[0]);
  };

  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const videoUrl = URL.createObjectURL(file);
      setUploadedVideo(videoUrl);
      setVideoType("uploaded");
      setHasProcessedVideo(false);
      setIsPlaying(false);
      setDetections([]); // Clear detections on new video upload

      // Upload video to backend for processing
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("http://localhost:8000/api/v1/video/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Upload result:", result);

          const videoId = result.video_id;
          console.log("Uploaded video ID:", videoId);
          if (videoId) {
            await processUploadedVideo(videoId);
          } else {
            console.error("No video_id or id returned from upload response", result);
          }
        } else {
          console.error("Failed to upload video");
        }
      } catch (error) {
        console.error("Error uploading video:", error);
      }
    }
  };

  const processUploadedVideo = async (videoId: string) => {
    try {
      console.log("Starting video processing for ID:", videoId);
      const response = await fetch(`http://localhost:8000/api/v1/detect/video/${videoId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_name: selectedModel,
          confidence_threshold: threshold,
          max_detections: 100,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Raw detection results:", result);
        
        // Check if detections exist in the response
        if (result && result.detections) {
          // Ensure each detection has the required properties
          const formattedDetections = result.detections.map((detection: any) => ({
            id: detection.id || Math.random().toString(),
            label: detection.label || 'Unknown',
            confidence: detection.confidence || 0,
            boundingBox: {
              x: detection.bounding_box?.x || 0,
              y: detection.bounding_box?.y || 0,
              width: detection.bounding_box?.width || 0,
              height: detection.bounding_box?.height || 0,
            },
            severity: detection.severity || 'medium',
            timestamp: detection.timestamp || new Date().toISOString(),
            frame_number: detection.frame_number,
            fps: detection.fps,
          }));
          
          console.log("Formatted detections:", formattedDetections);
          setDetections(formattedDetections);
          setHasProcessedVideo(true);
        } else {
          console.error("No detections found in response:", result);
          // Show error to user
          alert("No detections found in the video. Please try a different video or adjust the confidence threshold.");
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to process video. Status:", response.status, "Error:", errorText);
        // Show error to user
        alert(`Failed to process video: ${errorText}`);
      }
    } catch (error) {
      console.error("Error processing video:", error);
      // Show error to user
      alert("Error processing video. Please try again or use a different video file.");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const switchToLive = () => {
    setVideoType("live");
    setUploadedVideo(null);
    setIsPlaying(true);
    // Do not reset detections here to persist them
  };

  // Update FPS from backend metadata if available
  useEffect(() => {
    if (detections.length > 0 && detections[0].frame_number !== undefined && detections[0].fps) {
      setVideoFps(detections[0].fps);
    } else {
      // Default to 30 FPS if not provided by backend
      setVideoFps(30);
    }
  }, [detections]);

  // Update current frame as video plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateFrame = () => {
      setCurrentFrame(Math.floor(video.currentTime * videoFps));
    };
    video.addEventListener("timeupdate", updateFrame);
    return () => video.removeEventListener("timeupdate", updateFrame);
  }, [videoFps, uploadedVideo]);

  // Show detections for the closest frame_number to the current frame
  const getClosestDetections = () => {
    if (detections.length === 0) {
      console.log("No detections available");
      return [];
    }
    
    // If no frame numbers are provided, show all detections
    if (!detections.some(d => d.frame_number !== undefined)) {
      console.log("No frame numbers in detections, showing all:", detections);
      return detections;
    }

    let minDiff = Infinity;
    let closestFrame = null;
    detections.forEach((d) => {
      if (d.frame_number !== undefined) {
        const diff = Math.abs(d.frame_number - currentFrame);
        if (diff < minDiff) {
          minDiff = diff;
          closestFrame = d.frame_number;
        }
      }
    });
    const filteredDetections = detections.filter((d) => d.frame_number === closestFrame);
    console.log("Filtered detections for frame", closestFrame, ":", filteredDetections);
    return filteredDetections;
  };
  const frameDetections = getClosestDetections();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <Card className="w-full h-full bg-background">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>AI Inference Panel</CardTitle>
          <Badge variant="secondary" className="ml-2">
            Model may take some time wait till it loads
          </Badge>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {videoType === "live" ? "LIVE" : "UPLOADED"}
            </Badge>
            <Badge variant="outline">{selectedModel}</Badge>
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800"
            >
              Threshold: {Math.round(threshold * 100)}%
            </Badge>
            <Button variant="outline" size="sm" onClick={handleUploadClick}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
            {videoType === "uploaded" && (
              <Button variant="outline" size="sm" onClick={switchToLive}>
                <Video className="h-4 w-4 mr-2" />
                Switch to Live
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div
          className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-background p-4" : "h-[500px]"}`}
        >
          {/* Video Feed Container */}
          <div className="relative w-full h-full bg-black rounded-md overflow-hidden">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />

            {/* Video Feed */}
            {videoType === "uploaded" && uploadedVideo ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  src={uploadedVideo}
                  className="w-full h-full object-contain"
                  controls={true}
                  autoPlay={true}
                  loop={false}
                  muted={true}
                  playsInline
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
                {isPlaying && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                    <div className="flex items-center justify-between text-white">
                      <span>Playing</span>
                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.pause();
                          }
                        }}
                        className="px-2 py-1 bg-red-500 rounded hover:bg-red-600"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <img
                src={videoFeed}
                alt="Drone Feed"
                className="w-full h-full object-cover"
              />
            )}

            {/* Bounding Boxes Overlay */}
            {showBoundingBoxes && visualizationMode === "bounding-boxes" && (
              <div className="absolute inset-0 pointer-events-none">
                {frameDetections.map((detection) => {
                  console.log("Processing detection:", detection);
                  const scaled = scaleBox(detection.boundingBox);
                  console.log("Scaled box:", scaled);
                  return (
                    <div
                      key={detection.id}
                      className={`absolute border-2 border-red-500 ${showConfidenceScores ? "border-opacity-80" : "border-opacity-100"}`}
                      style={{
                        left: `${scaled.left}px`,
                        top: `${scaled.top}px`,
                        width: `${scaled.width}px`,
                        height: `${scaled.height}px`,
                      }}
                    >
                      {showConfidenceScores && (
                        <div className="absolute top-0 left-0 transform -translate-y-full bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                          {detection.label}:{" "}
                          {Math.round(detection.confidence * 100)}%
                          <span
                            className={`ml-1 inline-block w-2 h-2 rounded-full ${getSeverityColor(detection.severity)}`}
                          ></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Heatmap Overlay */}
            {visualizationMode === "heatmap" && (
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-500/20 to-red-500/40 mix-blend-overlay">
                {/* This is a simplified heatmap visualization */}
              </div>
            )}

            {/* Depth Map Overlay */}
            {visualizationMode === "depth-map" && (
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-green-500/20 to-yellow-500/30 mix-blend-overlay">
                {/* This is a simplified depth map visualization */}
              </div>
            )}

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={handlePlayPause}>
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={videoType === "live"}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={videoType === "live"}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={handleFullscreen}>
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="mt-4">
            <Tabs defaultValue="model">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="model">Model Settings</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="visualization">Display</TabsTrigger>
                <TabsTrigger value="detections">Results</TabsTrigger>
              </TabsList>
              <TabsContent
                value="visualization"
                className="p-4 border rounded-md mt-2"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-bounding-boxes">
                      Show Bounding Boxes
                    </Label>
                    <Switch
                      id="show-bounding-boxes"
                      checked={showBoundingBoxes}
                      onCheckedChange={setShowBoundingBoxes}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-confidence">
                      Show Confidence Scores
                    </Label>
                    <Switch
                      id="show-confidence"
                      checked={showConfidenceScores}
                      onCheckedChange={setShowConfidenceScores}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Visualization Mode</Label>
                    <Select
                      value={visualizationMode}
                      onValueChange={setVisualizationMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select visualization mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bounding-boxes">
                          Bounding Boxes
                        </SelectItem>
                        <SelectItem value="heatmap">Hazard Heatmap</SelectItem>
                        <SelectItem value="depth-map">Depth Map</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="model" className="p-4 border rounded-md mt-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>AI Model</Label>
                    <Select
                      value={selectedModel}
                      onValueChange={setSelectedModel}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook/detr-resnet-50">
                          DETR ResNet-50 (General Detection)
                        </SelectItem>
                        <SelectItem value="microsoft/yolov5">
                          YOLOv5 (High Accuracy Detection)
                        </SelectItem>
                        <SelectItem value="ultralytics/yolov8">
                          YOLOv8 (Latest Object Detection)
                        </SelectItem>
                        <SelectItem value="MCG-NJU/videomae-base">
                          VideoMAE (Video Classification)
                        </SelectItem>
                        <SelectItem value="damo/cv_resnet_depth-estimation">
                          ResNet (Depth Estimation)
                        </SelectItem>
                        <SelectItem value="openai/clip-vit-base-patch32">
                          CLIP (Zero-Shot Classification)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {selectedModel === "microsoft/yolov5" &&
                        "Recommended for reducing false positives"}
                      {selectedModel === "ultralytics/yolov8" &&
                        "Latest model with improved accuracy"}
                      {selectedModel === "facebook/detr-resnet-50" &&
                        "General purpose detection"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="confidence-threshold">
                        Confidence Threshold: {Math.round(threshold * 100)}%
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setThreshold(0.85)}
                      >
                        Reset to 85%
                      </Button>
                    </div>
                    <Slider
                      id="confidence-threshold"
                      min={0.5}
                      max={0.99}
                      step={0.01}
                      value={[threshold]}
                      onValueChange={handleThresholdChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher threshold reduces false positives like bushes being
                      detected as people
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent
                value="filters"
                className="p-4 border rounded-md mt-2"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Exclude Detection Types</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["person", "animal", "vegetation", "object"].map(
                        (label) => (
                          <div
                            key={label}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={label}
                              checked={excludedLabels.includes(label)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setExcludedLabels([...excludedLabels, label]);
                                } else {
                                  setExcludedLabels(
                                    excludedLabels.filter((l) => l !== label),
                                  );
                                }
                              }}
                              className="rounded"
                            />
                            <Label
                              htmlFor={label}
                              className="text-sm capitalize"
                            >
                              {label}
                            </Label>
                          </div>
                        ),
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Temporarily exclude problematic detection types to reduce
                      false positives
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Quick Fixes</Label>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setThreshold(0.9);
                          setSelectedModel("microsoft/yolov5");
                        }}
                      >
                        High Accuracy Mode (90% threshold + YOLOv5)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setExcludedLabels(["person"]);
                          setThreshold(0.85);
                        }}
                      >
                        Exclude Person Detection Temporarily
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent
                value="detections"
                className="p-4 border rounded-md mt-2"
              >
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {frameDetections.length > 0 ? (
                    frameDetections.map((detection) => (
                      <div
                        key={detection.id}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-block w-3 h-3 rounded-full ${getSeverityColor(detection.severity)}`}
                          ></span>
                          <span>{detection.label}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            onClick={() => {
                              const label = detection.label.toLowerCase();
                              if (!excludedLabels.includes(label)) {
                                setExcludedLabels([...excludedLabels, label]);
                              }
                            }}
                            title="Exclude this detection type"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <Badge variant="outline">
                          {Math.round(detection.confidence * 100)}%
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground">
                      No detections above threshold or all types excluded
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInferencePanel;