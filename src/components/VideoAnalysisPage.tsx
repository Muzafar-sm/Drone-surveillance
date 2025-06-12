import React, { useState } from 'react';
import VideoStreamingDetection from './VideoStreamingDetection';
import axios from 'axios';

const VideoAnalysisPage: React.FC = () => {
  const [videoId, setVideoId] = useState<string>('');
  const [uploadedVideoId, setUploadedVideoId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('/api/v1/video/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.video_id) {
        setUploadedVideoId(response.data.video_id);
        setVideoId(response.data.video_id);
      } else {
        setUploadError('Upload successful but no video ID was returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Real-time Video Analysis</h1>
      
      <div className="bg-white shadow-md rounded p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Video</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Select video file to upload:
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3"
            disabled={isUploading}
          />
        </div>
        
        {isUploading && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
            Uploading video... Please wait.
          </div>
        )}
        
        {uploadError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            {uploadError}
          </div>
        )}
        
        {uploadedVideoId && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
            Video uploaded successfully! ID: {uploadedVideoId}
          </div>
        )}
      </div>
      
      <div className="bg-white shadow-md rounded p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Analyze Existing Video</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Enter video ID:
          </label>
          <input
            type="text"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="e.g., ebc149d3-4467-4890-af4d-169e8407426a"
            className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3 mb-3"
          />
          
          <label className="block text-gray-700 mb-2">
            Confidence threshold: {confidenceThreshold}
          </label>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
            className="block w-full mb-4"
          />
        </div>
      </div>
      
      {videoId && (
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Video Analysis Results</h2>
          <VideoStreamingDetection 
            videoId={videoId} 
            confidenceThreshold={confidenceThreshold}
          />
        </div>
      )}
    </div>
  );
};

export default VideoAnalysisPage;