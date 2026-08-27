import { AudioTrack } from '../types';

// Web Audio Context for decoding and preview
let sharedAudioContext: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;
let currentGainNode: GainNode | null = null;
let activePlayingTrackId: string | null = null;
let playbackListeners: Array<(trackId: string | null) => void> = [];

export function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

export function subscribeToPlayback(listener: (trackId: string | null) => void) {
  playbackListeners.push(listener);
  return () => {
    playbackListeners = playbackListeners.filter((l) => l !== listener);
  };
}

function notifyPlaybackChanged(trackId: string | null) {
  activePlayingTrackId = trackId;
  playbackListeners.forEach((l) => l(trackId));
}

export function getActivePlayingTrackId(): string | null {
  return activePlayingTrackId;
}

export function stopAudioPlayback() {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch {
      // Ignore already stopped node
    }
    currentSourceNode = null;
  }
  if (currentGainNode) {
    try {
      currentGainNode.disconnect();
    } catch {
      // Ignore
    }
    currentGainNode = null;
  }
  notifyPlaybackChanged(null);
}

export async function playTrackPreview(track: AudioTrack) {
  if (activePlayingTrackId === track.id) {
    stopAudioPlayback();
    return;
  }

  stopAudioPlayback();

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  try {
    let buffer: AudioBuffer | null = track.audioBuffer || null;

    if (!buffer) {
      if (track.file) {
        const arrayBuffer = await track.file.arrayBuffer();
        buffer = await ctx.decodeAudioData(arrayBuffer);
      } else if (track.isSample) {
        buffer = createSampleAudioBuffer(ctx, track.duration, track.title);
      }
    }

    if (!buffer) return;

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.onended = () => {
      if (activePlayingTrackId === track.id) {
        notifyPlaybackChanged(null);
      }
    };

    source.start(0);
    currentSourceNode = source;
    currentGainNode = gainNode;
    notifyPlaybackChanged(track.id);
  } catch (err) {
    console.error('Failed to preview audio:', err);
    stopAudioPlayback();
  }
}

/**
 * Generate synthetic melodious audio buffer for demo/sample tracks
 */
export function createSampleAudioBuffer(ctx: AudioContext, durationSeconds: number, title: string): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.floor(sampleRate * Math.min(durationSeconds, 30)); // Preview max 30s
  const buffer = ctx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Generate pleasant harmonic chord progression based on title hash
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const rootFreq = 220 + (Math.abs(hash) % 220); // 220Hz - 440Hz
  const chords = [
    [rootFreq, rootFreq * 1.25, rootFreq * 1.5], // Major
    [rootFreq * 0.89, rootFreq * 1.06, rootFreq * 1.33], // Minor
    [rootFreq * 0.75, rootFreq * 0.94, rootFreq * 1.12], // Subdominant
    [rootFreq * 1.12, rootFreq * 1.35, rootFreq * 1.68], // Dominant
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.floor(t / 2) % chords.length;
    const chord = chords[chordIndex];

    let sample = 0;
    for (let c = 0; c < chord.length; c++) {
      sample += Math.sin(2 * Math.PI * chord[c] * t) * (0.15 / (c + 1));
      // Subtle harmonics & warm vibrato
      sample += Math.sin(2 * Math.PI * chord[c] * 2 * t) * 0.05;
    }

    // Envelope (soft attack and rhythmic pulse)
    const beat = (t % 0.5) / 0.5;
    const beatEnv = Math.exp(-beat * 4);
    const melody = sample * 0.7 + Math.sin(2 * Math.PI * rootFreq * 2 * t) * 0.1 * beatEnv;

    // Stereo panning variation
    left[i] = melody * (0.5 + 0.3 * Math.sin(t * 0.5));
    right[i] = melody * (0.5 + 0.3 * Math.cos(t * 0.5));
  }

  return buffer;
}

/**
 * Inspects a real audio File dropped or picked by the user.
 * Determines duration, file format, parses metadata/ID3 or filename.
 */
export async function inspectAudioFile(file: File): Promise<AudioTrack> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'mp3';
  const rawName = file.name.replace(/\.[^/.]+$/, '');
  
  let artist = '';
  let title = rawName;

  // Try parsing common artist - title pattern from filename
  if (rawName.includes(' - ')) {
    const parts = rawName.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  } else if (rawName.includes(' — ')) {
    const parts = rawName.split(' — ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' — ').trim();
  }

  // Attempt duration decoding via AudioContext
  let duration = 0;
  let audioBuffer: AudioBuffer | undefined;
  let status: 'ready' | 'error' = 'ready';
  let errorMessage: string | undefined;

  try {
    const ctx = getAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    duration = audioBuffer.duration;
  } catch {
    // If Web Audio API cannot decode natively (e.g. proprietary M4A/FLAC in some environments),
    // fallback to HTML5 Audio element probe
    try {
      duration = await probeAudioDurationWithElement(file);
    } catch {
      // Still allow valid audio with estimate
      duration = Math.max(30, Math.round(file.size / (192 * 1024 / 8))); // estimate ~192kbps
    }
  }

  return {
    id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title: title || file.name,
    artist: artist || 'Unknown Artist',
    filename: file.name,
    duration: Math.round(duration * 100) / 100 || 180,
    sizeBytes: file.size,
    format: extension,
    status,
    errorMessage,
    file,
    audioBuffer,
  };
}

function probeAudioDurationWithElement(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.preload = 'metadata';
    audio.src = url;

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Audio element probe failed'));
    };
  });
}

/**
 * Generates standard Red Book CUE Sheet (.cue)
 */
export function generateCueSheet(cdTitle: string, tracks: AudioTrack[], enableCdText: boolean): string {
  let cue = '';
  if (enableCdText) {
    cue += `TITLE "${cdTitle.replace(/"/g, '')}"\n`;
    cue += `PERFORMER "${tracks[0]?.artist.replace(/"/g, '') || 'Various Artists'}"\n`;
  }
  cue += `FILE "disc_image.wav" WAVE\n\n`;

  let currentSectorOffset = 0;

  tracks.forEach((track, index) => {
    const trackNum = (index + 1).toString().padStart(2, '0');
    cue += `  TRACK ${trackNum} AUDIO\n`;
    if (enableCdText) {
      cue += `    TITLE "${track.title.replace(/"/g, '')}"\n`;
      cue += `    PERFORMER "${track.artist.replace(/"/g, '')}"\n`;
    }

    const mins = Math.floor(currentSectorOffset / (60 * 75)).toString().padStart(2, '0');
    const secs = Math.floor((currentSectorOffset % (60 * 75)) / 75).toString().padStart(2, '0');
    const frames = Math.floor(currentSectorOffset % 75).toString().padStart(2, '0');
    
    cue += `    INDEX 01 ${mins}:${secs}:${frames}\n`;
    
    currentSectorOffset += Math.round(track.duration * 75);
  });

  return cue;
}

/**
 * Generates standard cdrdao Table of Contents (.toc)
 */
export function generateTocSheet(cdTitle: string, tracks: AudioTrack[], enableCdText: boolean): string {
  let toc = `CD_DA\n\n`;
  if (enableCdText) {
    toc += `CD_TEXT {\n`;
    toc += `  LANGUAGE_MAP {\n    0 : EN\n  }\n`;
    toc += `  LANGUAGE 0 {\n`;
    toc += `    TITLE "${cdTitle.replace(/"/g, '')}"\n`;
    toc += `    PERFORMER "${tracks[0]?.artist.replace(/"/g, '') || 'Various Artists'}"\n`;
    toc += `  }\n`;
    toc += `}\n\n`;
  }

  tracks.forEach((track, index) => {
    const trackNum = index + 1;
    toc += `// Track ${trackNum}\n`;
    toc += `TRACK AUDIO\n`;
    toc += `NO COPY\n`;
    if (enableCdText) {
      toc += `CD_TEXT {\n  LANGUAGE 0 {\n`;
      toc += `    TITLE "${track.title.replace(/"/g, '')}"\n`;
      toc += `    PERFORMER "${track.artist.replace(/"/g, '')}"\n`;
      toc += `  }\n}\n`;
    }
    toc += `FILE "track_${trackNum.toString().padStart(2, '0')}.wav" 0\n\n`;
  });

  return toc;
}

/**
 * Export CUE/TOC file to client as downloadable file
 */
export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
