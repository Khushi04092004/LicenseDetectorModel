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

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setDetectedPlate(null);
      setPlateNumber(null);
      setMessage(null);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!fileInputRef.current.files[0]) return;
  
    setIsLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
  
    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
      
      if (response.ok) {
        // Check if we have a message about no plate detected
        if (data.message && data.message.includes("No license plate detected")) {
          setMessage("No license plate detected in the image");
          setDetectedPlate(null);
          setPlateNumber(null);
        } 
        // Check if we have a plate number indicating no plate
        else if (data.plate_number === "No plate detected" || data.plate_number === "No license plate detected") {
          setMessage("No license plate detected in the image");
          setDetectedPlate(null);
          setPlateNumber(null);
        }
        // Normal case - plate detected
        else if (data.detected_plate) {
          const plateDataUrl = `data:image/png;base64,${data.detected_plate}`;
          setDetectedPlate(plateDataUrl);
          setPlateNumber(data.plate_number);
          setMessage(null);
        } 
        // Error case
        else {
          setMessage(data.message || "Failed to process the image");
          setDetectedPlate(null);
          setPlateNumber(null);
        }
      } else {
        setMessage(data.error || "Failed to process the image");
        setDetectedPlate(null);
        setPlateNumber(null);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage("An error occurred while processing the image");
      setDetectedPlate(null);
      setPlateNumber(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-700 via-blue-600 to-black p-6 text-white">
      <motion.div animate={{ scale: 1.1 }}>
        <Image src="/logo.png" alt="Logo" width={100} height={100} />
      </motion.div>
      <h1 className="text-3xl font-bold mb-6">License Plate Detector</h1>
      
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-lg">
        <div className="flex flex-col items-center gap-4">
          {image ? (
            <img src={image} alt="Uploaded" className="w-full h-auto rounded-lg shadow-md" />
          ) : (
            <div className="border-2 border-dashed border-gray-500 p-10 rounded-lg text-center">
              <UploadCloud size={50} className="text-gray-400 mb-2" />
              <p className="text-gray-400">Upload an image of a license plate</p>
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
          
          {/* Display message if plate not detected */}
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
                  alt="Detected License Plate" 
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
    </div>
  );
}