import React, { useState } from 'react';
import { AlertCircle, BarChart, List, Eye, Settings, Sliders } from 'lucide-react';

interface InfoPanelProps {
  darkMode: boolean;
  detectionStats: { [key: number]: number };
  processingStats: {
    fps: number;
    processTime: number;
    totalDetections: number;
  };
  classNames: string[];
}

interface DetectionItem {
  label: string;
  count: number;
  confidence: number;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ darkMode, detectionStats, processingStats, classNames }) => {
  const [activeTab, setActiveTab] = useState('detections');
  const [confidence, setConfidence] = useState(0.65);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);

  // Convert detection stats to array of DetectionItems
  const detections: DetectionItem[] = Object.entries(detectionStats).map(([classId, count]) => ({
    label: classNames[parseInt(classId)],
    count,
    confidence: 0.8 // This should come from the backend if available
  }));

  const handleConfidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfidence = parseFloat(e.target.value);
    setConfidence(newConfidence);
    fetch('http://localhost:8000/update-confidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confidence: newConfidence })
    });
  };

  const toggleClass = (classId: number) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
    fetch('http://localhost:8000/update-classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        classes: selectedClasses.includes(classId)
          ? selectedClasses.filter(id => id !== classId)
          : [...selectedClasses, classId]
      })
    });
  };

  return (
    <div className={`rounded-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'} shadow-md overflow-hidden transition-colors duration-300 h-full`}>
      <div className="border-b border-gray-700">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('detections')}
            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 flex-1 justify-center
              ${activeTab === 'detections' 
                ? `${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-slate-900'}`
                : `${darkMode ? 'text-gray-400 hover:bg-slate-700/50' : 'text-gray-500 hover:bg-gray-100'}`}
              transition-colors duration-200`}
          >
            <List size={16} />
            Detections
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 flex-1 justify-center
              ${activeTab === 'stats' 
                ? `${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-slate-900'}`
                : `${darkMode ? 'text-gray-400 hover:bg-slate-700/50' : 'text-gray-500 hover:bg-gray-100'}`}
              transition-colors duration-200`}
          >
            <BarChart size={16} />
            Statistics
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 flex-1 justify-center
              ${activeTab === 'settings' 
                ? `${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-slate-900'}`
                : `${darkMode ? 'text-gray-400 hover:bg-slate-700/50' : 'text-gray-500 hover:bg-gray-100'}`}
              transition-colors duration-200`}
          >
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {activeTab === 'detections' && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Detected Objects</h3>
            <div className="space-y-3">
              {detections.length === 0 ? (
                <div className={`p-4 rounded flex items-center gap-3 ${darkMode ? 'bg-slate-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  <Eye size={18} />
                  <p>Waiting for detections...</p>
                </div>
              ) : (
                detections.map((item, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded ${darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} transition-colors duration-300`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <Eye size={16} className="text-emerald-500" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        x{item.count}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" 
                        style={{ width: `${item.confidence * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">Confidence</span>
                      <span className="text-xs font-medium">{(item.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Processing Statistics</h3>
            <div className="space-y-4">
              <div className={`p-4 rounded ${darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} transition-colors duration-300`}>
                <div className="flex justify-between">
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>FPS</span>
                  <span className="font-bold">{processingStats.fps.toFixed(1)}</span>
                </div>
              </div>
              
              <div className={`p-4 rounded ${darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} transition-colors duration-300`}>
                <div className="flex justify-between">
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Process Time</span>
                  <span className="font-bold">{processingStats.processTime.toFixed(0)} ms</span>
                </div>
              </div>
              
              <div className={`p-4 rounded ${darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} transition-colors duration-300`}>
                <div className="flex justify-between">
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Detections</span>
                  <span className="font-bold">{processingStats.totalDetections}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Detection Settings</h3>
            <div className="space-y-4">
              <div className={`p-4 rounded ${darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} transition-colors duration-300`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Confidence Threshold</span>
                  <span className="font-bold">{Math.round(confidence * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={confidence}
                  onChange={handleConfidenceChange}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Detected Objects</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {classNames.map((name, index) => (
                    <button
                      key={index}
                      onClick={() => toggleClass(index)}
                      className={`p-2 text-sm rounded ${
                        selectedClasses.includes(index)
                          ? 'bg-emerald-500 text-white'
                          : darkMode
                          ? 'bg-slate-700 hover:bg-slate-600'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoPanel;