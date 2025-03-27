"use client";

import { useState, useRef } from "react";
import { UploadCloud } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append('image', fileInputRef.current.files[0]);

    try {
      const response = await fetch('http://localhost:5000/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to detect plate');
      }

      const data = await response.json();
      setResult(data.detected_plate || 'No plate detected');
    } catch (error) {
      console.error('Error:', error);
      setResult('Error detecting plate');
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
            disabled={!image} 
            className={`w-full px-4 py-2 rounded-lg text-white ${image ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"}`}
          >
            Detect Plate
          </button>
          {result && <p className="text-green-400 font-semibold mt-4">{result}</p>}
        </div>
      </div>
    </div>
  );
}
