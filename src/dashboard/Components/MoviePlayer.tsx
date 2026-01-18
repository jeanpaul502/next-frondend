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

    const [hasInteracted, setHasInteracted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect Mobile
    useEffect(() => {
        setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }, []);

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

        // 1. IOS Native HLS (Always preferred on iOS)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        if (isIOS && video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = sourceUrl;
            video.addEventListener('loadedmetadata', handlePlay);
        }
        // 2. HLS.js (Android / Desktop - Preferred over native Android HLS which can be buggy)
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
        // 3. Native Fallback (e.g. older Android / Safari Desktop)
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
             video.src = sourceUrl;
             video.addEventListener('loadedmetadata', handlePlay);
        }
        // 4. Standard Fallback (MP4 / WebM)
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
            if (screen.orientation && (screen.orientation as any).unlock) {
                try {
                    (screen.orientation as any).unlock();
                } catch(e) {}
            }
        };
    }, []);

    const enterFullscreen = async () => {
        const element = containerRef.current as any;
        const videoElement = videoRef.current as any;
        
        if (!element) return;

        // Android / Desktop: Use Container Fullscreen + Orientation Lock
        const requestMethod = element.requestFullscreen || 
                              element.webkitRequestFullscreen || 
                              element.mozRequestFullScreen || 
                              element.msRequestFullscreen;

        if (requestMethod) {
            try {
                await requestMethod.call(element);
                // Try to lock orientation
                if (screen.orientation && (screen.orientation as any).lock) {
                     try {
                        await (screen.orientation as any).lock('landscape');
                    } catch (e) {
                        console.warn("Orientation lock failed:", e);
                    }
                }
            } catch (e) {
                console.error("Fullscreen request failed:", e);
            }
        }
    };

    const exitFullscreen = () => {
        const doc = document as any;
        if (doc.exitFullscreen) {
            doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
            doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
            doc.msExitFullscreen();
        }
        
        if (screen.orientation && (screen.orientation as any).unlock) {
            try {
                (screen.orientation as any).unlock();
            } catch(e) {}
        }
    };

    const toggleFullscreen = () => {
        const doc = document as any;
        const videoEl = videoRef.current as any;
        const isFullscreen = doc.fullscreenElement || 
                           doc.webkitFullscreenElement || 
                           doc.mozFullScreenElement || 
                           doc.msFullscreenElement ||
                           (videoEl && videoEl.webkitDisplayingFullscreen);
        
        if (!isFullscreen) {
            enterFullscreen();
        } else {
            exitFullscreen();
        }
    };

    // Actions
    const togglePlay = async () => {
        if (!videoRef.current) return;

        try {
            if (videoRef.current.paused) {
                // Play first - critical for mobile to capture user gesture
                await videoRef.current.play();
                
                // Auto-fullscreen on first play/interaction for mobile
                if (!hasInteracted) {
                    setHasInteracted(true);
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                    if (isMobile) {
                        enterFullscreen().catch(console.warn);
                    }
                }
            } else {
                videoRef.current.pause();
            }
        } catch (error) {
            console.error("Playback failed:", error);
        }
    };

    const handleSkip = (seconds: number) => {
        if (!videoRef.current) return;
        const newTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), duration);
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const togglePiP = async () => {
        if (!videoRef.current) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (videoRef.current.requestPictureInPicture) {
                await videoRef.current.requestPictureInPicture();
            }
        } catch (error) {
            console.error("PiP failed:", error);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const time = parseFloat(e.target.value);
        if (Number.isFinite(time)) {
             videoRef.current.currentTime = time;
             setCurrentTime(time);
        }
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const vol = parseFloat(e.target.value);
        if (Number.isFinite(vol) && vol >= 0 && vol <= 1) {
            videoRef.current.volume = vol;
            setVolume(vol);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        if (volume > 0) {
            videoRef.current.volume = 0;
            setVolume(0);
        } else {
            videoRef.current.volume = 1;
            setVolume(1);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleClose = () => {
        exitFullscreen();
        onClose?.();
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

            {/* Top Bar (Back Button & PiP) */}
            <div className={`absolute top-0 left-0 w-full p-6 flex justify-between items-start transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <button
                    onClick={(e) => { e.stopPropagation(); handleClose(); }}
                    className="p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors backdrop-blur-md group-hover:scale-110"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {isMobile && (
                            <button
                                onClick={(e) => { e.stopPropagation(); togglePiP(); }}
                                className="p-3 text-white hover:text-gray-300 transition-colors transform hover:scale-110"
                                title="Picture-in-Picture"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m4 0V9a2 2 0 012-2h6a2 2 0 012 2v2M15 15h4v4h-4v-4z" />
                                </svg>
                            </button>
                        )}
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

            {/* Center Controls (Skips & Play/Pause) */}
            {!isBuffering && (showControls || !isPlaying) && (
                <div 
                    className="absolute inset-0 flex items-center justify-center gap-12 z-10 pointer-events-none"
                >
                    {/* -10s */}
                    {isMobile && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleSkip(-10); }}
                        className="p-4 text-white/80 hover:text-white transition-all pointer-events-auto transform hover:scale-110"
                    >
                        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
                            <text x="12" y="14" fontSize="7" fill="white" fontWeight="bold" textAnchor="middle" style={{ display: 'none' }}>10</text>
                        </svg>
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold mt-0.5">10</span>
                    </button>
                )}

                    {/* Play/Pause */}
                    <div 
                        className="w-20 h-20 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-black/40 hover:scale-105 hover:border-white/40 transition-all duration-300 cursor-pointer pointer-events-auto group/play"
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    >
                        {isPlaying ? (
                            <svg className="w-10 h-10 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                        ) : (
                            <svg className="w-10 h-10 text-white ml-1 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </div>

                    {/* +10s */}
                    {isMobile && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleSkip(10); }}
                            className="p-4 text-white/80 hover:text-white transition-all pointer-events-auto transform hover:scale-110"
                        >
                            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
                                <text x="12" y="14" fontSize="7" fill="white" fontWeight="bold" textAnchor="middle" style={{ display: 'none' }}>10</text>
                            </svg>
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold mt-0.5">10</span>
                        </button>
                    )}
                </div>
            )}

            {/* Bottom Controls */}
            <div
                className={`absolute bottom-0 left-0 w-full pt-12 pb-6 px-6 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
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
                        {!isMobile && (
                            <div className="flex items-center gap-3 group/volume relative">
                                <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors focus:outline-none drop-shadow-md">
                                    {volume === 0 ? (
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                        </svg>
                                    )}
                                </button>
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
                        )}
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
