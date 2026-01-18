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

    const [isBuffering, setIsBuffering] = useState(true);

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

        const handlePlay = () => {
            setIsBuffering(false);
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.warn("Autoplay prevented:", error);
                    setIsPlaying(false);
                });
            }
        };

        // 1. Try Native HLS (Safari / Mobile)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = sourceUrl;
            video.addEventListener('loadedmetadata', handlePlay);
        }
        // 2. Try HLS.js (Chrome / Firefox / Desktop)
        else if (Hls.isSupported() && isHlsUrl(sourceUrl)) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
            });
            hlsRef.current = hls;
            hls.loadSource(sourceUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, handlePlay);
            
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.error("HLS Fatal Error:", data);
                    setIsPlaying(false);
                    // Try to recover
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            // Cannot recover
                            hls.destroy();
                            break;
                    }
                }
            });
        }
        // 3. Fallback (MP4 / WebM)
        else {
            video.src = sourceUrl;
            video.addEventListener('loadedmetadata', handlePlay);
        }

        // Event Listeners
        const onTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            setIsBuffering(false);
        };
        const onDurationChange = () => setDuration(video.duration);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => setIsPlaying(false);
        const onWaiting = () => setIsBuffering(true);
        const onPlaying = () => setIsBuffering(false);
        const onError = (e: any) => {
            console.error("Video Error:", e);
            setIsPlaying(false);
            setIsBuffering(false);
        };

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('durationchange', onDurationChange);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('ended', onEnded);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('playing', onPlaying);
        video.addEventListener('error', onError);

        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('durationchange', onDurationChange);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('ended', onEnded);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('playing', onPlaying);
            video.removeEventListener('error', onError);
            video.removeEventListener('loadedmetadata', handlePlay);
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

    // Hide body scrollbar when player is active
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

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
                preload="auto"
                crossOrigin="anonymous"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                onDoubleClick={toggleFullscreen}
            />

            {/* Top Bar (Back Button) */}
            <div className={`absolute top-0 left-0 w-full p-6 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                    className="p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors backdrop-blur-md group-hover:scale-110"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            {/* Loading Spinner */}
            {isBuffering && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 bg-black/50 backdrop-blur-sm">
                    <div className="flex items-center space-x-3 bg-black/60 px-6 py-3 rounded-full border border-white/10 backdrop-blur-md shadow-xl">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                        <span className="text-white font-medium text-sm tracking-wide">
                            {currentTime === 0 ? "Connexion..." : "Chargement..."}
                        </span>
                    </div>
                </div>
            )}

            {/* Center Play Button */}
            {!isPlaying && !isBuffering && (
                <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                >
                    <div className="w-16 h-16 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-black/40 hover:scale-105 hover:border-white/40 transition-all duration-300 group/play">
                        <svg className="w-8 h-8 text-white ml-1 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Bottom Controls */}
            <div
                className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-6 px-6 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Movie Title */}
                <div className="mb-2 text-white/90 font-medium text-sm drop-shadow-md">
                    {movie?.title || 'Lecture en cours'}
                </div>

                {/* Progress Bar */}
                <div className="w-full mb-4 flex items-center gap-4">
                    <span className="text-white text-xs font-bold tracking-wide min-w-[45px]">{formatTime(currentTime)}</span>
                    <div className="relative flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer group/progress">
                        <div
                            className="absolute top-0 left-0 h-full bg-blue-600 rounded-full z-10"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-md" />
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
                    <span className="text-white text-xs font-bold tracking-wide min-w-[45px]">{formatTime(duration)}</span>
                </div>

                {/* Buttons Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={togglePlay} className="text-white hover:text-blue-500 transition-colors transform hover:scale-110">
                            {isPlaying ? (
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            )}
                        </button>

                        <div className="flex items-center gap-3 group/volume">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                            </svg>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={handleVolume}
                                className="w-24 h-1 accent-blue-600 cursor-pointer opacity-0 group-hover/volume:opacity-100 transition-opacity duration-200"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleFullscreen} className="text-white hover:text-blue-500 transition-colors transform hover:scale-110">
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    background: #2563EB;
                }
            `}</style>
        </div>
    );
};

export default MoviePlayer;
