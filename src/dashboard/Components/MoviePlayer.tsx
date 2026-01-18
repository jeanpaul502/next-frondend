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

const isHlsUrl = (url: string) =>
  /\.m3u8(\?|#|$)|api\/proxy\/stream/i.test(url);

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
  // VIDEO SETUP (INLINE, PORTRAIT SAFE)
  // =========================
  useEffect(() => {
    if (!videoRef.current || !movieUrl) return;

    const video = videoRef.current;
    const src = getProxiedUrl(movieUrl);

    console.log('[Player] init video', src);

    setIsBuffering(true);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // IMPORTANT: reset src completely
    video.pause();
    video.removeAttribute('src');
    video.load();

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS && video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('[Player] iOS native HLS');
      video.src = src;
    } else if (Hls.isSupported() && isHlsUrl(src)) {
      console.log('[Player] HLS.js attach');
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('[HLS error]', data);
      });
    } else {
      console.log('[Player] fallback src');
      video.src = src;
    }

    const onLoaded = () => {
      console.log('[Player] metadata loaded', video.duration);
      setDuration(video.duration || 0);
      setIsBuffering(false);
    };

    const onTime = () => setCurrentTime(video.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onError = () => {
      console.error('[Player] video error', video.error);
      setIsBuffering(false);
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [movieUrl]);

  // =========================
  // USER ACTIONS (NO FULLSCREEN FORCED)
  // =========================
  const play = async () => {
    if (!videoRef.current) return;
    try {
      console.log('[Player] play()');
      await videoRef.current.play(); // INLINE PLAY
    } catch (e) {
      console.error('[Player] play blocked', e);
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
      console.warn('[Player] PiP error', e);
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

  const format = (t: number) =>
    `${Math.floor(t / 60)}:${`${Math.floor(t % 60)}`.padStart(2, '0')}`;

  if (!movie) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-[100]"
      onMouseMove={() => setShowControls(true)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        onClick={(e) => e.stopPropagation()}
      />

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Chargement…
        </div>
      )}

      {/* TOP BAR */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between text-white">
          <button onClick={onClose}>✕</button>
          <button onClick={togglePiP}>📺</button>
        </div>
      )}

      {/* CENTER CONTROLS */}
      {!isBuffering && showControls && (
        <div className="absolute inset-0 flex items-center justify-center gap-10">
          <button onClick={() => seek(-10)} className="text-white text-xl">⏪</button>
          <button onClick={togglePlay} className="text-white text-4xl">
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={() => seek(10)} className="text-white text-xl">⏩</button>
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
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={onVolume}
            />
            <button onClick={toggleFullscreen}>⛶</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviePlayer;
