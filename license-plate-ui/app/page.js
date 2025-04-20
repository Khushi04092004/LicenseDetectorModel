"use client";

import { useState, useRef } from "react";
import { UploadCloud } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  const [image, setImage] = useState(null);
  const [detectedPlate, setDetectedPlate] = useState(null);
  const [plateNumber, setPlateNumber] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [videoUrl, setVideoUrl] = useState(null);
  const [detectedPlatesFromVideo, setDetectedPlatesFromVideo] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const videoInputRef = useRef(null);
  const [uploadedVideoBlob, setUploadedVideoBlob] = useState(null); // to show original video

  // IMAGE HANDLING
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setDetectedPlate(null);
      setPlateNumber(null);
      setMessage(null);
    }
  };

  const handleChooseFile = () => fileInputRef.current.click();

  const handleUpload = async () => {
    if (!fileInputRef.current.files[0]) return;

    setIsLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", fileInputRef.current.files[0]);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        if (
          data.message?.includes("No license plate detected") ||
          data.plate_number === "No plate detected"
        ) {
          setMessage("No license plate detected in the image");
          setDetectedPlate(null);
          setPlateNumber(null);
        } else {
          setDetectedPlate(`data:image/png;base64,${data.detected_plate}`);
          setPlateNumber(data.plate_number);
          setMessage(null);
        }
      } else {
        setMessage(data.error || "Failed to process the image");
        setDetectedPlate(null);
        setPlateNumber(null);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("An error occurred while processing the image");
      setDetectedPlate(null);
      setPlateNumber(null);
    } finally {
      setIsLoading(false);
    }
  };

  // VIDEO HANDLING
  const handleChooseVideo = () => videoInputRef.current.click();

  const handleVideoFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const localBlobUrl = URL.createObjectURL(file);
      setUploadedVideoBlob(localBlobUrl); // Show original video
      setVideoUrl(null); // Clear old processed video
      setDetectedPlatesFromVideo([]); // Clear results
      handleVideoUpload(file); // Start processing
    }
  };

  const handleVideoUpload = async (file) => {
    const formData = new FormData();
    formData.append("video", file);
    setVideoLoading(true);

    try {
      const res = await fetch("http://localhost:5000/upload_video", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.video_url) {
        setVideoUrl(data.video_url); // processed video
        setDetectedPlatesFromVideo(data.detected_plates || []);
      } else {
        console.error("Video upload failed:", data.message);
      }
    } catch (error) {
      console.error("Error uploading video:", error);
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-700 via-blue-600 to-black p-6 text-white">
      <div className="flex justify-center mb-8">
        <motion.div animate={{ scale: 1.1 }}>
          <Image src="/logo.png" alt="Logo" width={100} height={100} />
        </motion.div>
      </div>
      <h1 className="text-3xl font-bold text-center mb-10">
        License Plate Detector
      </h1>

      <div className="flex flex-col lg:flex-row gap-6 justify-center items-start">
        {/* IMAGE SECTION */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Image Detection
          </h2>
          <div className="flex flex-col items-center gap-4">
            {image ? (
              <img
                src={image}
                alt="Uploaded"
                className="w-full h-auto rounded-lg shadow-md"
              />
            ) : (
              <div className="border-2 border-dashed border-gray-500 p-10 rounded-lg text-center">
                <UploadCloud size={50} className="text-gray-400 mb-2" />
                <p className="text-gray-400">
                  Upload an image of a license plate
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleChooseFile}
              className="px-4 py-2 border rounded-lg bg-purple-600 hover:bg-purple-700"
            >
              Choose File
            </button>
            <button
              onClick={handleUpload}
              disabled={!image || isLoading}
              className={`w-full px-4 py-2 rounded-lg text-white ${
                image && !isLoading
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {isLoading ? "Processing..." : "Detect Plate"}
            </button>

            {message && (
              <div className="mt-4 w-full">
                <div className="bg-gray-800 p-4 rounded-lg text-center text-yellow-400">
                  {message}
                </div>
              </div>
            )}

            {detectedPlate && (
              <div className="mt-4 w-full">
                <h2 className="text-xl mb-2">Detected Plate:</h2>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <img
                    src={detectedPlate}
                    alt="Detected Plate"
                    className="max-w-full rounded-lg mb-4"
                  />
                  {plateNumber && (
                    <div className="mt-4 text-center">
                      <h3 className="text-lg mb-2">License Number:</h3>
                      <div className="bg-gray-600 p-3 rounded-lg font-mono text-2xl tracking-wider">
                        {plateNumber}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VIDEO SECTION */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Video Detection
          </h2>
          <div className="flex flex-col items-center gap-4">
            {videoUrl ? (
              <>
                <h3 className="text-lg font-semibold">Uploaded Video:</h3>
                <video
                  controls
                  src={uploadedVideoBlob}
                  className="w-full rounded-lg shadow-lg"
                />
                {videoUrl && (
                  <>
                    <h3 className="text-lg font-semibold">Processed Video:</h3>
                    <video
                      controls
                      width="500"
                      className="rounded-lg shadow-lg"
                    >
                      <source src={videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </>
                )}
              </>
            ) : uploadedVideoBlob ? (
              <>
                <h3 className="text-lg font-semibold">Uploaded Video:</h3>
                <video
                  controls
                  src={uploadedVideoBlob}
                  className="w-full rounded-lg shadow-lg"
                />
              </>
            ) : (
              <div className="border-2 border-dashed border-gray-500 p-10 rounded-lg text-center">
                <UploadCloud size={50} className="text-gray-400 mb-2" />
                <p className="text-gray-400">
                  Upload a video with license plates
                </p>
              </div>
            )}

            <input
              type="file"
              accept="video/*"
              ref={videoInputRef}
              onChange={handleVideoFileChange}
              className="hidden"
            />
            <button
              onClick={handleChooseVideo}
              className="px-4 py-2 border rounded-lg bg-purple-600 hover:bg-purple-700"
            >
              Choose Video
            </button>
            <button
              onClick={() =>
                videoInputRef.current?.files?.[0] &&
                handleVideoUpload(videoInputRef.current.files[0])
              }
              disabled={videoLoading}
              className={`w-full px-4 py-2 rounded-lg text-white ${
                !videoLoading
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {videoLoading ? "Processing..." : "Detect Plates"}
            </button>

            {detectedPlatesFromVideo.length > 0 && (
              <div className="w-full bg-gray-800 p-4 rounded-lg mt-4">
                <h3 className="text-lg mb-2">Detected Plates:</h3>
                <ul className="space-y-1">
                  {detectedPlatesFromVideo.map((plate, index) => (
                    <li
                      key={index}
                      className="bg-gray-600 p-2 rounded-lg text-center font-mono text-lg"
                    >
                      {plate}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
