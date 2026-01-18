'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { buildApiUrlWithParams } from '../../utils/config';

interface Movie {
  url?: string;
  videoUrl?: string;
  title: string;
}

interface MoviePlayerProps {
  movie?: Movie;
  onClose?: () => void;
}

const isHlsUrl = (url: string) => /\.m3u8(\?|#|$)|api\/proxy\/stream/i.test(url);

const getProxiedUrl = (url: string) => {
  if (!isHlsUrl(url)) return url;
  return buildApiUrlWithParams('/api/proxy/stream', { url });
};

const MoviePlayer = ({ movie, onClose }: MoviePlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );

  const movieUrl = movie?.videoUrl || movie?.url || '';

  // =========================
  // VIDEO INITIALISATION (NO AUTOPLAY)
  // =========================
  useEffect(() => {
    if (!videoRef.current || !movieUrl) return;

    const video = videoRef.current;
    const src = getProxiedUrl(movieUrl);

    setIsBuffering(true);
    setIsPlaying(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else if (Hls.isSupported() && isHlsUrl(src)) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.src = src;
    }

    const onLoaded = () => {
      setDuration(video.duration || 0);
      setIsBuffering(false);
    };
    const onTime = () => setCurrentTime(video.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [movieUrl]);

  // =========================
  // USER ACTIONS (SAFE MOBILE)
  // =========================
  const play = async () => {
    if (!videoRef.current) return;
    try {
      await videoRef.current.play();
      const v: any = videoRef.current;
      if (isMobile) {
        if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
        else if (v.requestFullscreen) await v.requestFullscreen();
      }
    } catch (e) {
      console.error('Play blocked', e);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    videoRef.current.paused ? play() : videoRef.current.pause();
  };

  const seek = (sec: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(
      Math.max(0, videoRef.current.currentTime + sec),
      duration
    );
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP error', e);
    }
  };

  const onSeekBar = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const t = Number(e.target.value);
    videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const onVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const v = Number(e.target.value);
    videoRef.current.volume = v;
    setVolume(v);
  };

  const format = (t: number) => `${Math.floor(t / 60)}:${`${Math.floor(t % 60)}`.padStart(2, '0')}`;

  if (!movie) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black z-[100]" onMouseMove={() => setShowControls(true)}>
      <video ref={videoRef} className="w-full h-full object-contain" playsInline preload="metadata" />

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center text-white">Chargement…</div>
      )}

      {/* CENTER CONTROLS */}
      {!isBuffering && showControls && (
        <div className="absolute inset-0 flex items-center justify-center gap-10">
          <button onClick={() => seek(-10)} className="text-white text-xl">⏪ 10</button>
          <button onClick={togglePlay} className="text-white text-4xl">
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={() => seek(10)} className="text-white text-xl">10 ⏩</button>
        </div>
      )}

      {/* BOTTOM BAR */}
      {showControls && (
        <div className="absolute bottom-0 w-full p-4 bg-black/60 text-white">
          <div className="flex items-center gap-2">
            <span>{format(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              value={currentTime}
              onChange={onSeekBar}
              className="flex-1"
            />
            <span>{format(duration)}</span>
          </div>

          <div className="flex items-center justify-between mt-3">
            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={onVolume} />

            <div className="flex gap-4">
              <button onClick={togglePiP}>PiP</button>
              <button onClick={toggleFullscreen}>⛶</button>
              <button onClick={onClose}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviePlayer;
