export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function deriveTitleFromTranscript(transcript: string): string {
  const cleaned = transcript.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return '';
  }

  const sentence = cleaned.split(/[.!?\n]/)[0]?.trim() ?? cleaned;
  if (!sentence) {
    return '';
  }

  return sentence.length > 58 ? `${sentence.slice(0, 58).trimEnd()}...` : sentence;
}
