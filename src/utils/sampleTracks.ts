import { AudioTrack } from '../types';

export const INITIAL_SAMPLE_TRACKS: AudioTrack[] = [
  {
    id: 'sample-1',
    title: 'Dreams',
    artist: 'Fleetwood Mac',
    filename: 'Dreams.mp3',
    duration: 257, // 4:17
    sizeBytes: 9800000,
    format: 'mp3',
    status: 'ready',
    isSample: true,
  },
  {
    id: 'sample-2',
    title: 'Everywhere',
    artist: 'Fleetwood Mac',
    filename: 'Everywhere.flac',
    duration: 223, // 3:43
    sizeBytes: 25400000,
    format: 'flac',
    status: 'ready',
    isSample: true,
  },
  {
    id: 'sample-3',
    title: 'Africa',
    artist: 'Toto',
    filename: 'Africa.m4a',
    duration: 295, // 4:55
    sizeBytes: 11200000,
    format: 'm4a',
    status: 'ready',
    isSample: true,
  },
  {
    id: 'sample-4',
    title: "Don't Stop Believin'",
    artist: 'Journey',
    filename: "Don't Stop Believin'.mp3",
    duration: 251, // 4:11
    sizeBytes: 9600000,
    format: 'mp3',
    status: 'ready',
    isSample: true,
  },
];

export const EXTRA_DEMO_TRACKS: AudioTrack[] = [
  {
    id: 'sample-5',
    title: 'Fast Car',
    artist: 'Tracy Chapman',
    filename: 'Fast Car.flac',
    duration: 296, // 4:56
    sizeBytes: 31200000,
    format: 'flac',
    status: 'ready',
    isSample: true,
  },
  {
    id: 'sample-6',
    title: 'Hotel California',
    artist: 'Eagles',
    filename: 'Hotel California.wav',
    duration: 390, // 6:30
    sizeBytes: 68700000,
    format: 'wav',
    status: 'ready',
    isSample: true,
  },
  {
    id: 'sample-7',
    title: 'Take on Me',
    artist: 'a-ha',
    filename: 'Take on Me.mp3',
    duration: 225, // 3:45
    sizeBytes: 8900000,
    format: 'mp3',
    status: 'ready',
    isSample: true,
  },
  {
    id: 'sample-8',
    title: 'Time After Time',
    artist: 'Cyndi Lauper',
    filename: 'Time After Time.ogg',
    duration: 241, // 4:01
    sizeBytes: 7800000,
    format: 'ogg',
    status: 'ready',
    isSample: true,
  },
];

export const VIRTUAL_OPTICAL_DRIVES = [
  {
    id: 'drive-pioneer',
    name: 'PIONEER BD-RW BDR-212EBK',
    vendor: 'Pioneer',
    isWriter: true,
    speeds: [4, 8, 16, 24, 32, 40, 48],
    mediaInserted: true,
    mediaType: 'CD-R' as const,
    isBlank: true,
    mediaCapacitySec: 4800, // 80 min
  },
  {
    id: 'drive-lg',
    name: 'LG WH16NS40 CD/DVD/BD Writer',
    vendor: 'LG Electronics',
    isWriter: true,
    speeds: [8, 16, 24, 32, 48],
    mediaInserted: true,
    mediaType: 'CD-R' as const,
    isBlank: true,
    mediaCapacitySec: 4800,
  },
  {
    id: 'drive-asus',
    name: 'ASUS SDRW-08D2S-U (Portable)',
    vendor: 'ASUS',
    isWriter: true,
    speeds: [4, 8, 16, 24],
    mediaInserted: true,
    mediaType: 'CD-RW' as const,
    isBlank: true,
    mediaCapacitySec: 4440, // 74 min
  },
];
