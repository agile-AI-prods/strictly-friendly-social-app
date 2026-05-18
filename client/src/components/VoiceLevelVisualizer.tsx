import { useEffect, useRef } from 'react';

export function VoiceLevelVisualizer({ stream }: { stream: MediaStream | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw bars
      const barWidth = (canvas.width / dataArray.length) * 1.5;
      let x = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = '#3b82f6'; // Tailwind blue-500
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      animationRef.current && cancelAnimationFrame(animationRef.current);
      source.disconnect();
      analyser.disconnect();
      audioCtx.close();
    };
  }, [stream]);

  return <canvas ref={canvasRef} width={200} height={40} className="mt-2" />;
} 