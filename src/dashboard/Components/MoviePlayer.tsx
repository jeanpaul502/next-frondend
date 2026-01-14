'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { buildApiUrlWithParams } from '../../utils/config';

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

const getProxiedUrl = (url: string) => {
  if (!isHlsUrl(url)) return url;
  return buildApiUrlWithParams('/api/proxy/stream', { url });
};

const MoviePlayer = ({ movie: movieProp, onClose }: MoviePlayerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const previousVolumeRef = useRef(1);
  const autoplayMutedRef = useRef(false);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [levels, setLevels] = useState<any[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);
  const [showMenu, setShowMenu] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const movie: Movie | undefined = movieProp;
  const movieUrl = movie?.videoUrl || movie?.url || '';

  useEffect(() => {
    let hideTimeout: any;
    const onMouseMove = () => {
      setShowControls(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        if (!isSeeking) setShowControls(false);
      }, 4000);
    };
    const el = containerRef.current;
    if (el) {
      el.addEventListener('mousemove', onMouseMove);
    }
    return () => {
      if (el) el.removeEventListener('mousemove', onMouseMove);
      clearTimeout(hideTimeout);
    };
  }, [isSeeking]);

  useEffect(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobileUA = /Android|iPhone|iPad|iPod/i.test(ua);
    const v = videoRef.current;
    if (isMobileUA && v) {
      setVolume(0);
      v.volume = 0;
      v.muted = true;
      autoplayMutedRef.current = true;
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => {
      const v = videoRef.current;
      if (v && v.paused) {
        v.play().catch(() => {});
      }
      if (autoplayMutedRef.current && v) {
        const pv = previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.5;
        setVolume(pv);
        v.volume = pv;
        v.muted = false;
        autoplayMutedRef.current = false;
      }
    };
    el.addEventListener('touchend', handler);
    el.addEventListener('click', handler);
    return () => {
      el.removeEventListener('touchend', handler);
      el.removeEventListener('click', handler);
    };
  }, [movieUrl]);
  useEffect(() => {
    if (!videoRef.current) return;
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const v = videoRef.current;
    v.pause();
    v.removeAttribute('src');
    v.load();

    const sourceUrl = getProxiedUrl(movieUrl);

    if (isHlsUrl(sourceUrl)) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          startLevel: -1,
          capLevelToPlayerSize: true,
          autoStartLoad: true,
        });
        hlsRef.current = hls;
        hls.loadSource(sourceUrl);
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, (_evt, data: any) => {
          setLevels(data.levels || []);
          setCurrentLevel(-1);
          setDuration(v.duration || 0);
          v.play().catch(() => setIsPlaying(false));
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (_evt, data: any) => {
          setCurrentLevel(data.level);
        });
      } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
        v.src = sourceUrl;
        v.addEventListener('loadedmetadata', () => {
          setDuration(v.duration || 0);
          v.play().catch(() => setIsPlaying(false));
        }, { once: true });
      }
    } else {
      v.src = sourceUrl;
      v.addEventListener('loadedmetadata', () => {
        setDuration(v.duration || 0);
        v.play().catch(() => setIsPlaying(false));
      }, { once: true });
    }

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      if (!isSeeking) setCurrentTime(v.currentTime || 0);
    };
    const onDurationChange = () => setDuration(v.duration || 0);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('durationchange', onDurationChange);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('durationchange', onDurationChange);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [movieUrl]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
    }
    if (v > 0) {
      previousVolumeRef.current = v;
    }
  };

  const handleQualitySelect = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
      setShowMenu(false);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
  };

  const formatTime = (sec: number) => {
    const s = Math.floor(sec || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
  };

  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black">
      <div id="app">
      <div id="playerWrap" ref={containerRef}>
        <div className={`topbar ${showControls ? '' : 'hide'}`}>
          <button className="btn exit" onClick={() => {
            if (typeof window !== 'undefined') {
              const v = videoRef.current;
              v?.pause();
            }
            onClose?.();
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M18 6l-12 12"></path>
              <path d="M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div id="player">
          <video
            ref={videoRef}
            preload="metadata"
            autoPlay
            muted={volume === 0}
            playsInline
            webkit-playsinline="true"
            x-webkit-airplay="allow"
          />
        </div>

        <div className={`jwbar ${showControls ? '' : 'hide'}`}>
          <button className="btn" id="btnPlay" onClick={togglePlay}>
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="#fff" d="M8 5h4v14H8zM14 5h4v14h-4z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="#fff" d="M5 3l16 9-16 9V3z"></path>
              </svg>
            )}
          </button>

          <span className="time-display">{formatTime(currentTime)}</span>

          <div className="seekWrap">
            <input
              id="seekRange"
              type="range"
              min="0"
              max={Math.max(duration, 0)}
              step="0.01"
              value={Math.min(currentTime, duration || 0)}
              onChange={handleSeekChange}
              onMouseDown={handleSeekStart}
              onMouseUp={handleSeekEnd}
              onTouchStart={handleSeekStart}
              onTouchEnd={handleSeekEnd}
            />
          </div>

          <span className="time-display">{formatTime(duration)}</span>

          <div className="volWrap">
            <button className="btn" onClick={() => setShowVolumePopup(s => !s)}>
              {volume === 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M15 8a5 5 0 0 1 1.912 4.936m-1.912 3.064a5 5 0 0 1 -1.912 -8" />
                  <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
                  <path d="M16 9l6 6" />
                  <path d="M22 9l-6 6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M15 8a5 5 0 0 1 0 8" />
                  <path d="M17.7 5a9 9 0 0 1 0 14" />
                  <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
                </svg>
              )}
            </button>
            <div className={`volPopup ${showVolumePopup ? 'show' : ''}`}>
              <input
                id="volRange"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>
          </div>

          <button className="btn" onClick={() => setShowMenu(s => !s)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
              <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
            </svg>
          </button>

          <button className="btn" onClick={toggleFullscreen}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
              <path d="M4 16v2a2 2 0 0 0 2 2h2" />
              <path d="M16 4h2a2 2 0 0 1 2 2v2" />
              <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
            </svg>
          </button>
        </div>

        <div className={`menu ${showMenu ? 'show' : ''}`}>
          <div className="hint">Qualité</div>
          <div
            className={`row ${currentLevel === -1 ? 'active' : ''}`}
            onClick={() => handleQualitySelect(-1)}
          >
            <span>Auto</span>
          </div>
          {levels.map((lvl: any, idx: number) => {
            const label =
              lvl.height >= 2160 ? '4K' :
              lvl.height >= 1440 ? '2K' :
              lvl.height >= 1080 ? 'FHD' :
              lvl.height >= 720 ? 'HD' : 'SD';
            return (
              <div
                key={idx}
                className={`row ${currentLevel === idx ? 'active' : ''}`}
                onClick={() => handleQualitySelect(idx)}
              >
                <span>{label}</span>
                <span>{lvl.height}p</span>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        :root{
          --bg: #000;
          --bar: rgba(0,0,0,.55);
          --bar2: rgba(0,0,0,.75);
          --txt: #fff;
          --muted: rgba(255,255,255,.72);
          --radius: 18px;
          --safe-b: env(safe-area-inset-bottom);
          --safe-l: env(safe-area-inset-left);
          --safe-r: env(safe-area-inset-right);
        }
        html, body { margin:0; padding:0; height:100%; background: var(--bg); overflow: hidden; }
        #app { height:100%; width:100%; display:flex; align-items:center; justify-content:center; }
        #playerWrap {
          position: relative;
          width: 100%;
          height: 100vh;
          background:#000;
          overflow:hidden;
          border-radius: 0;
          box-shadow: none;
        }
        @supports(height: 100dvh) {
          #playerWrap { height: 100dvh; }
        }
        #player { position:relative; width:100%; height:100%; }
        #playerWrap video {
          position:absolute;
          top:0;
          left:0;
          z-index:1;
          width:100% !important;
          height:100% !important;
          object-fit: cover;
          background:#000;
        }
        .topbar{
          position:absolute;
          top:0;
          left:0;
          right:0;
          padding: 20px calc(24px + var(--safe-r)) 0 calc(24px + var(--safe-l));
          display:flex;
          align-items:center;
          gap:10px;
          z-index:3;
          transition: opacity .22s ease;
          opacity: 1;
        }
        .topbar.hide {
          opacity: 0;
          pointer-events: none;
        }
        .topbar .exit{
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0,0,0,.55);
          border: 1px solid rgba(255,255,255,.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .topbar .exit svg {
          width: 16px;
          height: 16px;
        }
        .pill.time{
          background: rgba(0,0,0,.55);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 999px;
          padding: 8px 12px;
        }
        .jwbar {
          z-index:2;
          position:absolute;
          left:0; right:0;
          bottom:0;
          padding: 10px calc(12px + var(--safe-r)) calc(10px + var(--safe-b)) calc(12px + var(--safe-l));
          display:flex;
          align-items:center;
          gap:10px;
          background: linear-gradient(to top, var(--bar2), rgba(0,0,0,0));
          pointer-events:none;
          transition: opacity .22s ease;
          opacity: 1;
        }
        .jwbar.hide {
          opacity: 0;
          pointer-events: none;
        }
        .jwbar .btn,
        .jwbar .pill,
        .jwbar .menu,
        .jwbar .volWrap,
        .jwbar .volPopup {
          pointer-events:auto;
        }
        .btn {
          width:78px;
          height:78px;
          display:flex; align-items:center; justify-content:center;
          border-radius: 18px;
          background: transparent;
          border: 0;
          color: var(--txt);
          cursor:pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .btn:active { transform: scale(0.98); opacity: .9; }
        .btn[disabled] { opacity:.4; cursor:not-allowed; }
        .btn svg { width: 30px; height: 30px; }
        .seekWrap{
          flex:1;
          display:flex;
          align-items:center;
          padding: 0 10px;
        }
        #seekRange{
          -webkit-appearance:none;
          appearance:none;
          width: 100%;
          height: 8px;
          background: transparent;
          cursor: pointer;
          outline: none;
        }
        #seekRange::-webkit-slider-runnable-track{
          height: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,.35);
        }
        #seekRange::-webkit-slider-thumb{
          -webkit-appearance:none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          margin-top: -6px;
          box-shadow: 0 2px 10px rgba(0,0,0,.35);
        }
        #seekRange::-moz-range-track{
          height: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,.35);
        }
        #seekRange::-moz-range-thumb{
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          border: 0;
          box-shadow: 0 2px 10px rgba(0,0,0,.35);
        }
        .pill {
          display:flex; align-items:center; gap:8px;
          color: var(--txt);
          font: 13px/1.1 system-ui, -apple-system, Segoe UI, Roboto, Arial;
          user-select:none;
          opacity: .95;
        }
        .dot { width:8px; height:8px; border-radius:50%; background:#fff; display:inline-block; opacity:.9; }
        .label-live { letter-spacing:.2px; }
        .time-display {
          color: var(--txt);
          font: 14px system-ui, -apple-system, Segoe UI, Roboto, Arial;
          font-variant-numeric: tabular-nums;
          user-select: none;
          margin: 0 5px;
          min-width: 45px;
          text-align: center;
        }
        .menu {
          position:absolute;
          right: 12px;
          bottom: calc(56px + var(--safe-b));
          width: 220px;
          background: rgba(20,20,20,.92);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          padding: 10px;
          display:none;
          color: var(--txt);
          font: 14px system-ui, -apple-system, Segoe UI, Roboto, Arial;
          box-shadow: 0 12px 30px rgba(0,0,0,.45);
        }
        .menu.show { display:block; }
        .menu .row {
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding: 8px 10px;
          border-radius: 10px;
          cursor:pointer;
          user-select:none;
        }
        .menu .row:hover { background: rgba(255,255,255,.06); }
        .menu .row.active { background: rgba(255,255,255,.10); }
        .menu .hint { opacity:.7; font-size:12px; padding: 2px 10px 8px; }
        .toast {
          position:absolute;
          left:50%;
          transform:translateX(-50%);
          bottom: calc(70px + var(--safe-b));
          background: rgba(0,0,0,.65);
          color:#fff;
          padding: 8px 12px;
          border-radius: 999px;
          font: 13px system-ui, -apple-system, Segoe UI, Roboto, Arial;
          border: 1px solid rgba(255,255,255,.10);
          display:none;
          pointer-events:none;
        }
        .volWrap{ position:relative; display:flex; align-items:center; justify-content:center; }
        .volPopup{
          position:absolute;
          left:50%;
          transform:translateX(-50%);
          bottom: calc(78px + var(--safe-b));
          width: 38px;
          height: 160px;
          border-radius: 999px;
          background: rgba(0,0,0,.55);
          border: 1px solid rgba(255,255,255,.10);
          display:none;
          align-items:center;
          justify-content:center;
          padding: 10px 0;
          box-shadow: 0 12px 30px rgba(0,0,0,.45);
          z-index: 50;
        }
        .volPopup.show{ display:flex; }
        #volRange{
          -webkit-appearance:none;
          appearance:none;
          width: 130px;
          height: 8px;
          background: transparent;
          transform: rotate(-90deg);
          cursor: pointer;
          outline: none;
        }
        #volRange::-webkit-slider-runnable-track{
          height: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,.35);
        }
        #volRange::-webkit-slider-thumb{
          -webkit-appearance:none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          margin-top: -6px;
          box-shadow: 0 2px 10px rgba(0,0,0,.35);
        }
        #volRange::-moz-range-track{
          height: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,.35);
        }
        #volRange::-moz-range-thumb{
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          border: 0;
          box-shadow: 0 2px 10px rgba(0,0,0,.35);
        }
        @media (max-width: 820px) {
          .desktopOnly { display:none !important; }
          #btnPlay { display:none !important; }
          .jwbar{
            padding: 14px calc(14px + var(--safe-r)) calc(14px + var(--safe-b)) calc(14px + var(--safe-l));
            gap: 12px;
          }
          .btn {
            width: 52px;
            height: 52px;
            border-radius: 16px;
          }
          .btn svg {
            width: 24px !important;
            height: 24px !important;
          }
          .pill { font-size: 14px; }
          .dot { width: 9px; height: 9px; }
        }
      `}</style>
      </div>
    </div>
  );
};

export default MoviePlayer;
