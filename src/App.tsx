import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Crop, Download, Database, Settings, Plus, Trash2, Edit3 } from 'lucide-react';

interface TableData {
  headers: string[];
  rows: string[][];
}

interface CoalLogEntry {
  date: string;
  shift: string;
  coalType: string;
  tonnage: number;
  moisture: number;
  ashContent: number;
  sulfur: number;
  btu: number;
  inspector: string;
}

function App() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<TableData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCropTool, setShowCropTool] = useState(false);
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [cellValue, setCellValue] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Example coal log data
  const exampleData: CoalLogEntry[] = [
    {
      date: '2024-01-15',
      shift: 'Day',
      coalType: 'Bituminous',
      tonnage: 1250,
      moisture: 8.5,
      ashContent: 12.3,
      sulfur: 2.1,
      btu: 11500,
      inspector: 'J. Smith'
    },
    {
      date: '2024-01-15',
      shift: 'Night',
      coalType: 'Sub-bituminous',
      tonnage: 980,
      moisture: 12.2,
      ashContent: 8.7,
      sulfur: 1.8,
      btu: 9800,
      inspector: 'M. Johnson'
    },
    {
      date: '2024-01-16',
      shift: 'Day',
      coalType: 'Anthracite',
      tonnage: 750,
      moisture: 4.1,
      ashContent: 6.2,
      sulfur: 0.9,
      btu: 13200,
      inspector: 'R. Davis'
    }
  ];

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setShowApiKeyInput(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setShowCropTool(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setSelectedImage(imageData);
        setShowCropTool(true);
        
        // Stop camera stream
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleCropComplete = () => {
    // Simplified crop - in a real app, you'd use a proper cropping library
    setCroppedImage(selectedImage);
    setShowCropTool(false);
  };

  const processImage = async () => {
    if (!croppedImage || !apiKey) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate OCR processing - replace with actual OCR API call
      setTimeout(() => {
        // Mock extracted data that looks like a coal log
        const mockData: TableData = {
          headers: ['Date', 'Shift', 'Coal Type', 'Tonnage', 'Moisture %', 'Ash %', 'Sulfur %', 'BTU', 'Inspector'],
          rows: [
            ['2024-01-15', 'Day', 'Bituminous', '1250', '8.5', '12.3', '2.1', '11500', 'J. Smith'],
            ['2024-01-15', 'Night', 'Sub-bituminous', '980', '12.2', '8.7', '1.8', '9800', 'M. Johnson'],
            ['2024-01-16', 'Day', 'Anthracite', '750', '4.1', '6.2', '0.9', '13200', 'R. Davis']
          ]
        };
        setExtractedData(mockData);
        setIsProcessing(false);
      }, 3000);
    } catch (error) {
      console.error('Error processing image:', error);
      setIsProcessing(false);
      alert('Error processing image. Please try again.');
    }
  };

  const downloadCSV = () => {
    if (!extractedData) return;
    
    const csvContent = [
      extractedData.headers.join(','),
      ...extractedData.rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coal_log_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const saveToDatabase = () => {
    if (!extractedData) return;
    
    // Simulate database save - in a real app, you'd call your backend API
    const existingData = JSON.parse(localStorage.getItem('coalLogData') || '[]');
    const newData = [...existingData, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      data: extractedData
    }];
    
    localStorage.setItem('coalLogData', JSON.stringify(newData));
    alert('Data saved to database successfully!');
  };

  const handleCellEdit = (rowIndex: number, colIndex: number) => {
    if (extractedData) {
      setEditingCell({ row: rowIndex, col: colIndex });
      setCellValue(extractedData.rows[rowIndex][colIndex]);
    }
  };

  const saveCellEdit = () => {
    if (editingCell && extractedData) {
      const newData = { ...extractedData };
      newData.rows[editingCell.row][editingCell.col] = cellValue;
      setExtractedData(newData);
      setEditingCell(null);
      setCellValue('');
    }
  };

  const addRow = () => {
    if (extractedData) {
      const newRow = new Array(extractedData.headers.length).fill('');
      setExtractedData({
        ...extractedData,
        rows: [...extractedData.rows, newRow]
      });
    }
  };

  const deleteRow = (index: number) => {
    if (extractedData) {
      const newRows = extractedData.rows.filter((_, i) => i !== index);
      setExtractedData({
        ...extractedData,
        rows: newRows
      });
    }
  };

  const loadExampleData = () => {
    const exampleTableData: TableData = {
      headers: ['Date', 'Shift', 'Coal Type', 'Tonnage', 'Moisture %', 'Ash %', 'Sulfur %', 'BTU', 'Inspector'],
      rows: exampleData.map(entry => [
        entry.date,
        entry.shift,
        entry.coalType,
        entry.tonnage.toString(),
        entry.moisture.toString(),
        entry.ashContent.toString(),
        entry.sulfur.toString(),
        entry.btu.toString(),
        entry.inspector
      ])
    };
    setExtractedData(exampleTableData);
  };

  if (showApiKeyInput) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Settings className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Coal Log Digitizer</h1>
            <p className="text-gray-600">Enter your OCR API key to get started</p>
          </div>
          
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                OCR API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your API key..."
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Continue
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={loadExampleData}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Skip and load example data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Coal Log Book Digitizer</h1>
          <p className="text-gray-600">Convert handwritten or printed coal log tables to digital format</p>
        </div>

        {/* Step 1: Image Input */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 1: Capture or Upload Image</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Upload an image of your coal log table</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Choose File
              </button>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Take a photo with your camera</p>
              <div className="space-y-2">
                <button
                  onClick={startCamera}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 mr-2"
                >
                  Start Camera
                </button>
                <button
                  onClick={capturePhoto}
                  className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition-colors duration-200"
                >
                  Capture
                </button>
              </div>
            </div>
          </div>
          
          <video ref={videoRef} autoPlay className="mt-4 max-w-full h-auto rounded-lg" style={{ display: videoRef.current?.srcObject ? 'block' : 'none' }} />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Step 2: Crop Image */}
        {showCropTool && selectedImage && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 2: Crop Image (Optional)</h2>
            <div className="text-center">
              <img src={selectedImage} alt="Selected" className="max-w-full h-auto rounded-lg mx-auto mb-4" style={{ maxHeight: '400px' }} />
              <div className="space-x-4">
                <button
                  onClick={handleCropComplete}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 inline-flex items-center"
                >
                  <Crop className="h-4 w-4 mr-2" />
                  Use This Image
                </button>
                <button
                  onClick={() => setShowCropTool(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Process Image */}
        {croppedImage && !extractedData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 3: Extract Table Data</h2>
            <div className="text-center">
              <img src={croppedImage} alt="Cropped" className="max-w-full h-auto rounded-lg mx-auto mb-4" style={{ maxHeight: '300px' }} />
              <button
                onClick={processImage}
                disabled={isProcessing}
                className="bg-purple-600 text-white px-8 py-3 rounded-md hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Extract Table Data'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review and Edit Data */}
        {extractedData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Step 4: Review and Edit Data</h2>
              <button
                onClick={addRow}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 inline-flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Row
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    {extractedData.headers.map((header, index) => (
                      <th key={index} className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                        {header}
                      </th>
                    ))}
                    <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {row.map((cell, colIndex) => (
                        <td key={colIndex} className="border border-gray-300 px-4 py-2">
                          {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={cellValue}
                                onChange={(e) => setCellValue(e.target.value)}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                autoFocus
                              />
                              <button
                                onClick={saveCellEdit}
                                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleCellEdit(rowIndex, colIndex)}
                              className="cursor-pointer hover:bg-blue-50 p-1 rounded"
                            >
                              {cell || '-'}
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <button
                          onClick={() => deleteRow(rowIndex)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete Row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 5: Export Options */}
        {extractedData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 5: Export Data</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={downloadCSV}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors duration-200 inline-flex items-center justify-center"
              >
                <Download className="h-5 w-5 mr-2" />
                Download as CSV
              </button>
              <button
                onClick={saveToDatabase}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors duration-200 inline-flex items-center justify-center"
              >
                <Database className="h-5 w-5 mr-2" />
                Save to Database
              </button>
            </div>
          </div>
        )}

        {/* Example Data Section */}
        {!extractedData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Example Coal Log Data</h2>
            <p className="text-gray-600 mb-4">Here's what a typical coal log book table looks like:</p>
            
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Shift</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Coal Type</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Tonnage</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Moisture %</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Ash %</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Sulfur %</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">BTU</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Inspector</th>
                  </tr>
                </thead>
                <tbody>
                  {exampleData.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{entry.date}</td>
                      <td className="border border-gray-300 px-4 py-2">{entry.shift}</td>
                      <td className="border border-gray-300 px-4 py-2">{entry.coalType}</td>
                      <td className="border border-gray-300 px-4 py-2">{entry.tonnage}</td>
                      <td className="border border-gray-300 px-4 py-2">{entry.moisture}</td>
                      <td className="border border-gray-300 px-4 py-2">{entry.ashContent}</td>
                      <td className="border border-gray-300 px-4 py-2">{entry.sulfur}</td>
                      <td className="border border-gray-300 px-4 py-2">{entry.btu}</td>
                      <td className="border border-gray-300 px-4 py-2">{entry.inspector}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button
              onClick={loadExampleData}
              className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors duration-200"
            >
              Load Example Data for Testing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;