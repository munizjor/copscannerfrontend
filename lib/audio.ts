// lib/audio.ts

/**
 * Extracts the audio key from a given audio path or URL.
 * Removes 'alert_audio/' prefix if present.
 */
export function extractAudioKey(audioPath: string): string {
  let key = audioPath;
  try {
    const url = new URL(key);
    key = url.pathname.split('/').pop() || '';
  } catch {
    // Not a URL, use as is
  }
  if (key.startsWith('alert_audio/')) {
    key = key.replace(/^alert_audio\//, '');
  }
  return key;
}
