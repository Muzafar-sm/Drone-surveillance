import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Detection {
  id: string;
  label: string;
  confidence: number;
  bounding_box: BoundingBox;
  severity: string;
}

interface Classification {
  id: string;
  label: string;
  confidence: number;
  category: string;
}

interface FrameResult {
  type: string;
  frame_number: number;
  timestamp: number;
  detections: Detection[];
  classifications: Classification[];
}

interface VideoMetadata {
  type: string;
  video_id: string;
  fps: number;
  width: number;
  height: number;
  frame_count: number;
  duration: number;
}

interface VideoStreamingDetectionProps {
  videoId: string;
  confidenceThreshold?: number;
  modelName?: string;
}

const VideoStreamingDetection: React.FC<VideoStreamingDetectionProps> = ({
  videoId,
  confidenceThreshold = 0.5,
  modelName = 'facebook/detr-resnet-50',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [currentFrame, setCurrentFrame] = useState<FrameResult | null>(null);
  const [allFrames, setAllFrames] = useState<FrameResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Start streaming detection
  const startStreamingDetection = async () => {
    setIsProcessing(true);
    setError(null);
    setAllFrames([]);
    setCurrentFrame(null);
    setProgress(0);
    
    try {
      const response = await fetch(`/api/v1/detect/video/${videoId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confidence_threshold: confidenceThreshold,
          model_name: modelName,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body reader could not be created');
      }
      
      // Process the stream
      const processStream = async () => {
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Convert the Uint8Array to a string
          const chunk = new TextDecoder().decode(value);
          buffer += chunk;
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            
            try {
              const data = JSON.parse(line);
              
              if (data.type === 'metadata') {
                setMetadata(data);
              } else if (data.type === 'frame_result') {
                setCurrentFrame(data);
                setAllFrames(prev => [...prev, data]);
                
                // Update progress
                if (metadata) {
                  setProgress((data.frame_number / metadata.frame_count) * 100);
                }
                
                // Draw detections on canvas
                drawDetections(data);
              } else if (data.type === 'complete') {
                setIsProcessing(false);
                setProgress(100);
              } else if (data.error) {
                setError(data.error);
                setIsProcessing(false);
              }
            } catch (e) {
              console.error('Error parsing JSON:', e, line);
            }
          }
        }
      };
      
      processStream().catch(e => {
        setError(`Stream processing error: ${e.message}`);
        setIsProcessing(false);
      });
      
    } catch (e) {
      setError(`Failed to start streaming: ${e.message}`);
      setIsProcessing(false);
    }
  };
  
  // Draw detections on canvas
  const drawDetections = (frame: FrameResult) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || !metadata) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Draw detections
    frame.detections.forEach(detection => {
      const { x, y, width, height } = detection.bounding_box;
      
      // Set style based on severity
      let color = 'green';
      if (detection.severity === 'high') color = 'red';
      else if (detection.severity === 'medium') color = 'orange';
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // Draw label
      ctx.fillStyle = color;
      ctx.font = '14px Arial';
      ctx.fillText(
        `${detection.label} (${Math.round(detection.confidence * 100)}%)`,
        x, y > 20 ? y - 5 : y + height + 15
      );
    });
    
    // Draw classifications
    if (frame.classifications.length > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 250, 30 + frame.classifications.length * 20);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('Classifications:', 20, 30);
      
      frame.classifications.forEach((classification, index) => {
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(
          `${classification.label} (${Math.round(classification.confidence * 100)}%)`,
          20, 50 + index * 20
        );
      });
    }
  };
  
  // Load video and set up event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.src = `/api/v1/video/stream/${videoId}`;
    
    const handleCanPlay = () => {
      // Start detection when video is ready
      startStreamingDetection();
    };
    
    video.addEventListener('canplay', handleCanPlay);
    
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoId]);
  
  // Sync video playback with current frame
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentFrame || !metadata) return;
    
    // Seek to the timestamp of the current frame
    const targetTime = currentFrame.timestamp;
    
    if (Math.abs(video.currentTime - targetTime) > 0.5) {
      video.currentTime = targetTime;
    }
    
    // Draw the current frame's detections
    drawDetections(currentFrame);
  }, [currentFrame, metadata]);
  
  return (
    <div className="video-streaming-detection">
      <div className="video-container relative">
        <video 
          ref={videoRef}
          className="w-full"
          controls
          muted
          playsInline
        />
        <canvas 
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        
        {isProcessing && (
          <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white p-2">
            <div className="flex items-center">
              <div className="mr-2">Processing: {Math.round(progress)}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          {error}
        </div>
      )}
      
      <div className="mt-4">
        <h3 className="text-lg font-semibold">Real-time Classifications</h3>
        <div className="bg-gray-100 p-4 rounded">
          {currentFrame?.classifications.map(classification => (
            <div key={classification.id} className="mb-2">
              <span className="font-medium">{classification.label}</span>
              <span className="ml-2 text-gray-600">
                {Math.round(classification.confidence * 100)}%
              </span>
              <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                {classification.category}
              </span>
            </div>
          ))}
          {!currentFrame?.classifications.length && !isProcessing && (
            <p>No classifications available</p>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-lg font-semibold">Real-time Detections</h3>
        <div className="bg-gray-100 p-4 rounded">
          {currentFrame?.detections.map(detection => (
            <div key={detection.id} className="mb-2">
              <span 
                className={`font-medium ${
                  detection.severity === 'high' 
                    ? 'text-red-600' 
                    : detection.severity === 'medium' 
                    ? 'text-orange-600' 
                    : 'text-green-600'
                }`}
              >
                {detection.label}
              </span>
              <span className="ml-2 text-gray-600">
                {Math.round(detection.confidence * 100)}%
              </span>
              <span 
                className={`ml-2 text-xs px-2 py-1 rounded ${
                  detection.severity === 'high' 
                    ? 'bg-red-100 text-red-800' 
                    : detection.severity === 'medium' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {detection.severity}
              </span>
            </div>
          ))}
          {!currentFrame?.detections.length && !isProcessing && (
            <p>No detections available</p>
          )}
        </div>
      </div>
      
      <button
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={startStreamingDetection}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Restart Detection'}
      </button>
    </div>
  );
};

export default VideoStreamingDetection;