/**
 * Time formatting helpers for Audio CD calculations.
 * Red Book Audio CD specifications:
 * 1 second = 75 sectors (frames)
 * 1 minute = 60 seconds = 4,500 sectors
 * 1 80-minute CD = 80 * 60 = 4,800 seconds (360,000 sectors, ~703 MB PCM)
 */

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeDetailed(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hundredths = Math.floor((seconds % 1) * 100);
  
  return `${mins}:${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function secondsToSectors(seconds: number): number {
  return Math.round(seconds * 75);
}

export function sectorsToTime(sectors: number): string {
  const totalSeconds = sectors / 75;
  return formatTime(totalSeconds);
}
