import React from 'react';
import { Camera } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
}

const Header: React.FC<HeaderProps> = ({ darkMode }) => {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3">
        <Camera 
          size={36} 
          className={`${darkMode ? 'text-emerald-400' : 'text-emerald-600'} transition-colors duration-300`} 
        />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">YOLO Real-Time Detection</h1>
          <p className={`text-sm md:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`}>
            Powered by YOLOv8 object detection
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;