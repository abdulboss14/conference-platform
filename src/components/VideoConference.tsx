import { useEffect, useRef } from 'react';
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface VideoConferenceProps {
  className?: string;
}

export default function VideoConference({ className = '' }: VideoConferenceProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    // Load Jitsi script
    const script = document.createElement('script');
    script.src = 'https://8x8.vc/vpaas-magic-cookie-0d3bdcb9d83a4dffa3766acaf094f10d/external_api.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (jitsiContainerRef.current) {
        apiRef.current = new window.JitsiMeetExternalAPI("8x8.vc", {
          roomName: "vpaas-magic-cookie-0d3bdcb9d83a4dffa3766acaf094f10d/SampleAppSoloSleepsDictateUneasily",
          parentNode: jitsiContainerRef.current,
          height: '100%',
          width: '100%',
        });
      }
    };

    return () => {
      // Cleanup
      if (apiRef.current) {
        apiRef.current.dispose();
      }
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className={`w-full h-[600px] ${className}`}>
      <div ref={jitsiContainerRef} className="w-full h-full" />
    </div>
  );
} 