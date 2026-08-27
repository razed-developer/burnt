import React, { useState, useEffect } from 'react';
import { UploadCloud } from 'lucide-react';

interface AudioDropZoneProps {
  onFilesDropped: (files: FileList | File[]) => void;
  children: React.ReactNode;
}

export const AudioDropZone: React.FC<AudioDropZoneProps> = ({
  onFilesDropped,
  children,
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsDraggingOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDraggingOver(false);
        dragCounter = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDraggingOver(false);
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesDropped(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onFilesDropped]);

  return (
    <div className="relative w-full h-full flex flex-col min-h-screen">
      {children}

      {/* Drag overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-orange-600/90 backdrop-blur-xs flex flex-col items-center justify-center text-white pointer-events-none p-6 animate-in fade-in duration-200">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-4 border border-white/30 shadow-lg">
            <UploadCloud className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Drop Audio Files to Add to CD
          </h2>
          <p className="text-sm text-orange-100 font-mono">
            Supports MP3, FLAC, WAV, M4A, OGG, AAC, AIFF
          </p>
        </div>
      )}
    </div>
  );
};
