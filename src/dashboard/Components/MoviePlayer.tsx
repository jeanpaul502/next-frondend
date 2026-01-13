'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Hls from 'hls.js';
import { ArrowLeft } from 'lucide-react';
import { API_BASE_URL, buildApiUrlWithParams } from '../../utils/config';
import Player from 'video.js/dist/types/player';

interface Movie {
  url?: string;
  videoUrl?: string;
  title: string;
  [key: string]: any;
}

interface MoviePlayerProps {
  movie?: Movie;
  onClose?: () => void;
}

const MoviePlayer = ({ movie: movieProp, onClose }: MoviePlayerProps) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isReady, setIsReady] = useState(false);

  const movie: Movie | undefined = movieProp;
  const movieUrl = movie?.videoUrl || movie?.url || '';

  // Fonction pour détecter si l'URL est au format HLS (m3u8)
  const isHlsUrl = (url: string) => {
    if (!url) return false;
    const hlsPatterns = [
      /\.m3u8(\?|#|$)/i,
      /\/playlist\.m3u8/i,
      /\/manifest\.m3u8/i,
      /\/master\.m3u8/i,
      /\/index\.m3u8/i,
      /\/stream\.m3u8/i,
      /api\/proxy\/stream/i,
      /hls/i,
      /streaming/i,
      /application\/x-mpegURL/i,
      /application\/vnd\.apple\.mpegurl/i
    ];
    return hlsPatterns.some(pattern => pattern.test(url));
  };

  // Fonction pour proxifier les URLs HLS
  const getProxiedUrl = (url: string) => {
    if (!isHlsUrl(url)) return url;
    return buildApiUrlWithParams('/api/proxy/stream', { url });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Log pour débogage
    const sourceUrl = getProxiedUrl(movieUrl);
    const type = isHlsUrl(sourceUrl) ? 'application/x-mpegURL' : 'video/mp4';
    console.log("[MoviePlayer] Initializing with URL:", sourceUrl);

    // Création dynamique de l'élément vidéo pour éviter les conflits DOM React/Video.js
    const videoElement = document.createElement("video-js");
    videoElement.classList.add('vjs-big-play-centered', 'vjs-theme-city');
    videoElement.setAttribute('playsinline', 'playsinline');
    videoElement.setAttribute('webkit-playsinline', 'webkit-playsinline');
    container.appendChild(videoElement);

    const options = {
        autoplay: true,
        controls: true,
        responsive: true,
        fill: true,
        fluid: false,
        preload: 'auto',
        controlBar: {
          children: [
            'playToggle',
            'volumePanel',
            'currentTimeDisplay', // Temps écoulé
            'progressControl',    // Barre de progression
            'durationDisplay',    // Durée totale
            'playbackRateMenuButton',
            'audioTrackButton', // Bouton pour changer les pistes audio (langues)
            'subsCapsButton',
            'qualitySelector',
            'pictureInPictureToggle',
            'fullscreenToggle',
          ],
        },
        sources: [{
          src: sourceUrl,
          type: type
        }],
      html5: {
        vhs: {
          overrideNative: !videojs.browser.IS_IOS,
          enableLowLatency: false,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
      userActions: {
        hotkeys: true
      },
      playbackRates: [0.5, 1, 1.5, 2]
    };

    const player = videojs(videoElement, options, function(this: any) {
      videojs.log('Player is ready');
      setIsReady(true);
      const playPromise = this.play();
      if (playPromise !== undefined) {
        playPromise.catch((e: any) => console.error("Autoplay failed:", e));
      }
    });

    playerRef.current = player;

    player.on('error', () => {
      console.error("VideoJS Error:", player.error());
      try {
        if (!isHlsUrl(sourceUrl)) return;

        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        const techEl = player.tech(true) && (player.tech(true) as any).el?.() as HTMLVideoElement | undefined;

        if (Hls.isSupported()) {
          if (!player.isDisposed()) player.dispose();
          playerRef.current = null;

          if (containerRef.current) {
            containerRef.current.innerHTML = '';
            const plainVideo = document.createElement('video');
            plainVideo.controls = true;
            plainVideo.autoplay = true;
            plainVideo.playsInline = true;
            plainVideo.setAttribute('playsinline', 'playsinline');
            plainVideo.setAttribute('webkit-playsinline', 'webkit-playsinline');
            plainVideo.style.width = '100%';
            plainVideo.style.height = '100%';
            containerRef.current.appendChild(plainVideo);

            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              startLevel: -1,
              capLevelToPlayerSize: true,
              autoStartLoad: true,
            });
            hlsRef.current = hls;
            hls.loadSource(sourceUrl);
            hls.attachMedia(plainVideo);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setIsReady(true);
              plainVideo.play().catch(() => {});
            });
            hls.on(Hls.Events.ERROR, (_evt, data) => {
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                  default:
                    console.error("HLS.js fatal error:", data);
                    break;
                }
              }
            });
          }
        }
        else {
          const el = techEl;
          if (el && el.canPlayType && el.canPlayType('application/vnd.apple.mpegurl')) {
            el.src = sourceUrl;
            el.play().catch(() => {});
          }
        }
      } catch (e) {
        console.error("Fallback HLS.js init failed:", e);
      }
    });

    // Cleanup function
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [movieUrl]); // Re-créer le lecteur si l'URL change

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      {/* Back Button Overlay */}
      <div className="absolute top-4 left-4 z-[60]">
        <button 
          onClick={handleBack}
          className="bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-md border border-white/10 transition-all cursor-pointer group shadow-lg hover:shadow-blue-500/20"
        >
          <ArrowLeft size={24} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Desktop Title Overlay - Bottom Positioned */}
      {movie && (
        <div className="hidden md:block absolute bottom-20 left-0 w-full p-4 z-[60] pointer-events-none transition-opacity duration-300 desktop-title-overlay">
          <h1 className="text-white text-lg font-bold drop-shadow-md ml-4">{movie.title || movie.name}</h1>
        </div>
      )}

      {/* Video Container */}
      <div className="w-full h-full max-w-screen max-h-screen flex items-center justify-center overflow-hidden">
        <div ref={containerRef} className="w-full h-full overflow-hidden" />
      </div>

      {/* Custom Styles to make it look modern */}
      <style jsx global>{`
        .video-js {
          width: 100%;
          height: 100%;
          background-color: #000;
          font-family: 'Inter', sans-serif;
        }
        
        /* Control Bar Styling - Bottom aligned & Gradient */
        .video-js .vjs-control-bar {
          background-color: transparent !important;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent) !important;
          bottom: 0 !important;
          width: 100% !important;
          left: 0 !important;
          border-radius: 0 !important;
          padding: 0 10px !important;
          margin-bottom: 0 !important;
          display: flex;
          align-items: center;
          height: 80px;
        }

        /* Time Display Styling */
        .video-js .vjs-current-time,
        .video-js .vjs-duration {
            display: block !important;
            padding: 0 10px;
            font-size: 14px;
            font-weight: 500;
        }
        
        .video-js .vjs-time-divider {
            display: none !important; /* Hide divider as we separate them */
        }
        
        /* Force Progress Bar to be inline and flexible */
        .video-js .vjs-progress-control {
            flex: 1 1 auto !important;
            width: auto !important;
            position: relative !important;
            height: auto !important; /* Changed from 100% to auto to avoid layout stretching issues */
            display: flex !important;
            align-items: center !important;
            top: 0 !important;
            margin-top: 0 !important; /* Ensure no top margin */
        }
        
        .video-js .vjs-progress-holder {
            margin: 0 10px !important;
            height: 4px !important;
            display: flex !important; /* Ensure flex for centering inner elements if any */
            align-items: center !important;
        }

        /* Ensure all control bar items are vertically centered */
        .video-js .vjs-control-bar > * {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important; /* Center content horizontally within the button area */
            height: 100% !important;
            margin: 0 !important; /* Remove any default margins */
            padding: 0 10px !important; /* Uniform padding for clickable areas */
        }
        
        /* Remove padding from progress control to let it expand */
        .video-js .vjs-progress-control {
            padding: 0 !important; 
        }

        /* Fix specific heights and alignment for buttons */
        .video-js .vjs-button {
             top: 0 !important;
             display: flex !important;
             align-items: center !important;
             justify-content: center !important;
        }
        
        /* Fix icon vertical alignment inside buttons */
        .video-js .vjs-button > .vjs-icon-placeholder:before {
            position: relative !important;
            top: 0 !important;
            line-height: 1 !important; /* Reset line height to avoid shifts */
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }

        /* Volume panel specific fix */
        .video-js .vjs-volume-panel {
            display: flex !important;
            align-items: center !important;
        }

        /* Playback Rate Button Alignment Fix */
        .video-js .vjs-playback-rate {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 100% !important;
        }
        .video-js .vjs-playback-rate .vjs-playback-rate-value {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 100% !important;
            line-height: 1 !important;
            font-size: 1.4em !important; /* Match icon size approx */
            pointer-events: none; /* Let clicks pass to button */
        }

        /* Play Button Customization - Blue */
        .vjs-big-play-button {
          background-color: rgba(37, 99, 235, 0.9) !important; /* Blue-600 */
          border-color: rgba(37, 99, 235, 0.9) !important;
          border-radius: 50% !important;
          width: 2.5em !important;
          height: 2.5em !important;
          line-height: 2.5em !important;
          margin-left: -1.25em !important;
          margin-top: -1.25em !important;
          transition: all 0.3s ease;
        }
        .vjs-big-play-button:hover {
          background-color: #1d4ed8 !important; /* Blue-700 */
          transform: scale(1.1);
        }

        /* Custom Loading Spinner - Blue style like forms */
        .vjs-loading-spinner {
          border: 4px solid rgba(59, 130, 246, 0.1) !important; /* Blue-500 transparent base */
          border-top-color: #3b82f6 !important; /* Blue-500 active */
          border-radius: 50% !important;
          background-color: transparent !important;
          width: 60px !important;
          height: 60px !important;
          margin-left: -30px !important;
          margin-top: -30px !important;
        }
        
        .vjs-loading-spinner:before, .vjs-loading-spinner:after {
          display: none !important;
        }

        /* Hide Scrollbars */
        .video-js .vjs-tech {
          overflow: hidden !important;
        }
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default MoviePlayer;
