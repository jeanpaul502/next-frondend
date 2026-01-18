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
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [volume, setVolume] = useState(1);
    const controlTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const movie: Movie | undefined = movieProp;
    const movieUrl = movie?.videoUrl || movie?.url || '';

    // Initialize Video & HLS
    useEffect(() => {
        if (!videoRef.current) return;
        const video = videoRef.current;

        // Reset
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        const sourceUrl = getProxiedUrl(movieUrl);

        if (Hls.isSupported() && isHlsUrl(sourceUrl)) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
            });
            hlsRef.current = hls;
            hls.loadSource(sourceUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => setIsPlaying(false));
            });
        } else {
            video.src = sourceUrl;
            video.play().catch(() => setIsPlaying(false));
        }

        // Event Listeners
        const onTimeUpdate = () => setCurrentTime(video.currentTime);
        const onDurationChange = () => setDuration(video.duration);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => setIsPlaying(false);

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('durationchange', onDurationChange);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('ended', onEnded);

        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('durationchange', onDurationChange);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('ended', onEnded);
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, [movieUrl]);

    // Handle Controls Visibility
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
        controlTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    useEffect(() => {
        if (isPlaying) {
            controlTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
        return () => {
            if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
        };
    }, [isPlaying]);

    // Actions
    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const time = parseFloat(e.target.value);
        videoRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const vol = parseFloat(e.target.value);
        videoRef.current.volume = vol;
        setVolume(vol);
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    if (!movie) return null;

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[100] w-full h-full bg-black overflow-hidden font-sans group"
            onMouseMove={handleMouseMove}
            onClick={togglePlay}
        >
            {/* Video */}
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                crossOrigin="anonymous"
                onClick={(e) => e.stopPropagation()} // Let container click handle play/pause or double click
                onDoubleClick={toggleFullscreen}
            />

            {/* Top Bar (Back Button) */}
            <div className={`absolute top-0 left-0 w-full p-4 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 11" fill="none" className="w-6 h-6">
                        <path d="M7.41499 5.00001L10.705 1.70501C10.8688 1.51371 10.9544 1.26763 10.9447 1.01595C10.935 0.764278 10.8307 0.525539 10.6526 0.347444C10.4745 0.16935 10.2357 0.0650171 9.98405 0.055296C9.73237 0.0455748 9.48629 0.131181 9.29499 0.295007L5.99999 3.58501L2.70499 0.295007C2.51369 0.131181 2.26762 0.0455748 2.01594 0.055296C1.76426 0.0650171 1.52552 0.16935 1.34743 0.347444C1.16934 0.525539 1.065 0.764278 1.05528 1.01595C1.04556 1.26763 1.13117 1.51371 1.29499 1.70501L4.58499 5.00001L1.29499 8.29501C1.19031 8.38466 1.10529 8.49497 1.04527 8.61904C0.985244 8.7431 0.951515 8.87824 0.946195 9.01596C0.940876 9.15367 0.964081 9.29101 1.01436 9.41933C1.06463 9.54766 1.14089 9.6642 1.23834 9.76166C1.3358 9.85911 1.45235 9.93537 1.58067 9.98565C1.709 10.0359 1.84633 10.0591 1.98405 10.0538C2.12177 10.0485 2.2569 10.0148 2.38096 9.95473C2.50503 9.89471 2.61535 9.80969 2.70499 9.70501L5.99999 6.41501L9.29499 9.70501C9.48629 9.86884 9.73237 9.95444 9.98405 9.94472C10.2357 9.935 10.4745 9.83067 10.6526 9.65257C10.8307 9.47448 10.935 9.23574 10.9447 8.98406C10.9544 8.73239 10.8688 8.48631 10.705 8.29501L7.41499 5.00001Z" fill="white" fillOpacity="0.8"></path>
                    </svg>
                </button>
            </div>

            {/* Center Play Button */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Bottom Controls */}
            <div
                className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Progress Bar */}
                <div className="w-full mb-4 flex items-center gap-3">
                    <span className="text-white text-xs font-medium min-w-[40px]">{formatTime(currentTime)}</span>
                    <div className="relative flex-1 h-1.5 bg-white/30 rounded-full cursor-pointer group/progress">
                        <div
                            className="absolute top-0 left-0 h-full bg-[#8e40ee] rounded-full z-10"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                    </div>
                    <span className="text-white text-xs font-medium min-w-[40px]">{formatTime(duration)}</span>
                </div>

                {/* Buttons Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="text-white hover:text-[#8e40ee] transition-colors">
                            {isPlaying ? (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                            ) : (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            )}
                        </button>

                        <div className="flex items-center gap-2 group/volume">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                            </svg>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={handleVolume}
                                className="w-20 h-1 accent-[#8e40ee] cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleFullscreen} className="text-white hover:text-[#8e40ee] transition-colors">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    background: #8e40ee;
                }
            `}</style>
        </div>
    );
};

export default MoviePlayer;
