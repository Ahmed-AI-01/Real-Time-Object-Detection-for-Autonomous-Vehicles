import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VideoFeed from './components/VideoFeed';
import InfoPanel from './components/InfoPanel';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [detectionStats, setDetectionStats] = useState<{ [key: number]: number }>({});
  const [processingStats, setProcessingStats] = useState({
    fps: 0,
    processTime: 0,
    totalDetections: 0
  });

  // KITTI dataset class names
  const classNames = [
    'Car',
    'Van',
    'Truck',
    'Pedestrian',
    'Person_sitting',
    'Cyclist',
    'Tram',
    'Misc',
    'DontCare'
  ];

  // Update stats every second
  useEffect(() => {
    const statsInterval = setInterval(async () => {
      try {
        const [statsResponse, processingResponse] = await Promise.all([
          fetch('http://localhost:8000/detection-stats'),
          fetch('http://localhost:8000/processing-stats')
        ]);
        
        if (statsResponse.ok && processingResponse.ok) {
          const [stats, processing] = await Promise.all([
            statsResponse.json(),
            processingResponse.json()
          ]);
          
          setDetectionStats(stats);
          setProcessingStats(processing);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }, 1000);

    return () => clearInterval(statsInterval);
  }, []);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-slate-900'} transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex justify-end mb-4">
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
        </div>
        <Header darkMode={darkMode} />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/3">
            <VideoFeed darkMode={darkMode} />
          </div>
          <div className="lg:w-1/3">
            <div className={`rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg p-4`}>
              <InfoPanel 
                darkMode={darkMode} 
                detectionStats={detectionStats}
                processingStats={processingStats}
                classNames={classNames}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;