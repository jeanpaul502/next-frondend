'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { API_BASE_URL } from '../utils/config';
import { getCountryFlagUrl } from '../utils/countries';
import { cleanChannelName } from '../utils/channelUtils';

interface Playlist {
    id: string;
    countryName: string;
    countryCode: string;
    isActive: boolean;
}

interface Channel {
    id: number;
    name: string;
    logo?: string;
    url: string;
    group?: string;
}

export const TVPlayer = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Paramètres d'URL
    const channelUrl = searchParams.get('url');
    const channelName = searchParams.get('name');
    const channelLogo = searchParams.get('logo');
    const initialPlaylistId = searchParams.get('playlistId');

    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);

    // États pour la liste des chaînes et playlists
    const [showSidebar, setShowSidebar] = useState(false);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [isPlaylistDropdownOpen, setIsPlaylistDropdownOpen] = useState(false);
    const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
    const [isLoadingChannels, setIsLoadingChannels] = useState(false);

    // États pour le design (adaptés de MoviePlayer)
    const [lastNonMutedVolume, setLastNonMutedVolume] = useState<number>(1);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // États pour la qualité vidéo et audio
    const [levels, setLevels] = useState<any[]>([]);
    const [currentLevel, setCurrentLevel] = useState<number>(-1);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [videoQualityLabel, setVideoQualityLabel] = useState<string>('AUTO');

    // États pour les pistes audio
    const [audioTracks, setAudioTracks] = useState<any[]>([]);
    const [currentAudioTrack, setCurrentAudioTrack] = useState<number>(-1);
    const [showAudioMenu, setShowAudioMenu] = useState(false);

    const hlsRef = useRef<Hls | null>(null);

    // Groupes dérivés des chaînes
    const groups = React.useMemo(() => {
        return Array.from(new Set(channels.map(c => c.group).filter(Boolean))) as string[];
    }, [channels]);

    // Chaînes filtrées
    const filteredChannels = React.useMemo(() => {
        return channels.filter(c => !selectedGroup || c.group === selectedGroup);
    }, [channels, selectedGroup]);

    // Initialisation du lecteur
    useEffect(() => {
        // Nettoyage complet avant toute nouvelle initialisation
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.removeAttribute('src');
            videoRef.current.load();
        }

        if (!channelUrl || !videoRef.current) return;

        let hls: Hls | null = null;
        setIsLoading(true);
        setError(null);
        setVideoQualityLabel('Auto'); // Reset label
        setIsPlaying(true); // Reset play state for new channel

        const handlePlayPromise = (promise: Promise<void> | undefined) => {
            if (promise !== undefined) {
                promise.catch(error => {
                    if (error.name === 'AbortError') {
                        // Ignore abort errors as they happen when switching channels
                    } else {
                        setIsPlaying(false);
                    }
                });
            }
        };

        const initPlayer = () => {
            if (Hls.isSupported()) {
                hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    startLevel: -1,
                    capLevelToPlayerSize: true,
                    autoStartLoad: true,
                });
                hlsRef.current = hls;

                hls.loadSource(channelUrl);
                hls.attachMedia(videoRef.current!);

                hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    if (!hls) return;
                    setIsLoading(false);
                    setLevels(data.levels);
                    // S'assurer que le niveau est sur Auto au démarrage
                    hls.currentLevel = -1;
                    setCurrentLevel(-1);
                    setVideoQualityLabel('Auto');
                    handlePlayPromise(videoRef.current?.play());
                });

                hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (event, data) => {
                    // Audio tracks updated
                    setAudioTracks(data.audioTracks);

                    // Si aucune piste n'est sélectionnée ou si on a des pistes, on s'assure qu'une est active
                    if (data.audioTracks.length > 0 && currentAudioTrack === -1) {
                        // HLS.js gère généralement ça, mais on met à jour l'état UI
                        const currentTrackId = hls?.audioTrack || 0;
                        setCurrentAudioTrack(currentTrackId);
                    }
                });

                hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                    const level = hls?.levels[data.level];
                    if (level) {
                        const height = level.height;
                        let label = 'SD';
                        if (height >= 2160) label = '4K';
                        else if (height >= 1440) label = '2K';
                        else if (height >= 1080) label = 'FHD';
                        else if (height >= 720) label = 'HD';

                        // Si nous sommes en mode Auto (hls.autoLevelEnabled est true ou currentLevel est -1)
                        // On affiche "Auto (Qualité)" pour indiquer que c'est automatique mais montrer la qualité actuelle
                        if (hls?.autoLevelEnabled || hls?.currentLevel === -1) {
                            setVideoQualityLabel(`Auto (${label})`);
                        } else {
                            setVideoQualityLabel(label);
                        }
                    }
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls?.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls?.recoverMediaError();
                                break;
                            default:
                                setError("Impossible de charger le flux. Veuillez réessayer.");
                                hls?.destroy();
                                break;
                        }
                    }
                });
            } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                videoRef.current.src = channelUrl;
                videoRef.current.addEventListener('loadedmetadata', () => {
                    setIsLoading(false);
                    handlePlayPromise(videoRef.current?.play());
                });
                videoRef.current.addEventListener('error', () => {
                    setError("Impossible de charger le flux.");
                });
            } else {
                setError("Votre navigateur ne supporte pas la lecture de ce flux.");
            }
        };

        initPlayer();

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [channelUrl]);

    // Chargement des playlists
    useEffect(() => {
        const fetchPlaylists = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/playlists`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    const activePlaylists = data.filter((p: Playlist) => p.isActive);
                    setPlaylists(activePlaylists);

                    // Sélectionner la playlist initiale si fournie
                    if (initialPlaylistId) {
                        const current = activePlaylists.find((p: Playlist) => p.id === initialPlaylistId);
                        if (current) setSelectedPlaylist(current);
                    } else if (activePlaylists.length > 0) {
                        setSelectedPlaylist(activePlaylists[0]);
                    }
                }
            } catch (error) {
                console.error('Error fetching playlists:', error);
            }
        };

        fetchPlaylists();
    }, [initialPlaylistId]);

    // Chargement des chaînes quand la playlist change
    useEffect(() => {
        if (!selectedPlaylist) return;

        const fetchChannels = async () => {
            setIsLoadingChannels(true);
            setSelectedGroup(null); // Réinitialiser le groupe
            try {
                const response = await fetch(`${API_BASE_URL}/playlists/${selectedPlaylist.id}/channels`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setChannels(data);
                } else {
                    setChannels([]);
                }
            } catch (error) {
                console.error('Error fetching channels:', error);
                setChannels([]);
            } finally {
                setIsLoadingChannels(false);
            }
        };

        fetchChannels();
    }, [selectedPlaylist]);

    // Gestion des contrôles (timeout)
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (showControls) {
            timeout = setTimeout(() => {
                // Ne pas cacher si le sidebar est ouvert ou si la vidéo est en pause ou si un dropdown est ouvert
                if (isPlaying && !showSidebar && !isPlaylistDropdownOpen && !isGroupDropdownOpen) {
                    setShowControls(false);
                }
            }, 5000);
        }

        return () => clearTimeout(timeout);
    }, [showControls, isPlaying, showSidebar, isPlaylistDropdownOpen, isGroupDropdownOpen]);

    const handleMouseMove = () => {
        setShowControls(true);
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const seek = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            if (isMuted) {
                videoRef.current.volume = lastNonMutedVolume;
                setVolume(lastNonMutedVolume);
                setIsMuted(false);
            } else {
                setLastNonMutedVolume(volume || 1);
                videoRef.current.volume = 0;
                setVolume(0);
                setIsMuted(true);
            }
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
            if (newVolume > 0) setLastNonMutedVolume(newVolume);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement && !(document as any).webkitFullscreenElement && !(document as any).mozFullScreenElement && !(document as any).msFullscreenElement) {
            const element = containerRef.current as any;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            } else if ((document as any).mozCancelFullScreen) {
                (document as any).mozCancelFullScreen();
            } else if ((document as any).msExitFullscreen) {
                (document as any).msExitFullscreen();
            }
            setIsFullscreen(false);
        }
    };

    const handleScreenClick = () => {
        if (showSidebar) {
            setShowSidebar(false);
        } else {
            setShowControls(!showControls);
        }
    };

    // Fonction pour naviguer vers la chaîne suivante
    const handleNextChannel = () => {
        if (!channels.length) return;

        const currentIndex = channels.findIndex(c => c.url === channelUrl);
        let nextIndex;

        if (currentIndex === -1 || currentIndex === channels.length - 1) {
            nextIndex = 0;
        } else {
            nextIndex = currentIndex + 1;
        }

        handleChannelClick(channels[nextIndex]);
    };

    // Fonction pour naviguer vers la chaîne précédente
    const handlePrevChannel = () => {
        if (!channels.length) return;

        const currentIndex = channels.findIndex(c => c.url === channelUrl);
        let prevIndex;

        if (currentIndex === -1 || currentIndex === 0) {
            prevIndex = channels.length - 1;
        } else {
            prevIndex = currentIndex - 1;
        }

        handleChannelClick(channels[prevIndex]);
    };

    const handleChannelClick = (channel: Channel) => {
        // Naviguer vers la nouvelle chaîne en remplaçant l'URL actuelle
        router.push(`/watch/tv?url=${encodeURIComponent(channel.url)}&name=${encodeURIComponent(channel.name)}&logo=${encodeURIComponent(channel.logo || '')}&playlistId=${selectedPlaylist?.id}`);
    };

    // Fonction pour changer la qualité
    const handleQualityChange = (levelIndex: number) => {
        if (hlsRef.current) {
            hlsRef.current.currentLevel = levelIndex;
            setCurrentLevel(levelIndex);
            setShowQualityMenu(false);

            if (levelIndex === -1) {
                setVideoQualityLabel('AUTO');
            }
        }
    };

    // Fonction pour changer la piste audio
    const handleAudioTrackChange = (trackId: number) => {
        if (hlsRef.current) {
            hlsRef.current.audioTrack = trackId;
            setCurrentAudioTrack(trackId);
            setShowAudioMenu(false);
        }
    };

    const handleClose = () => {
        router.back();
    };

    if (!channelUrl) return null;

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[100] w-full h-full bg-black overflow-hidden font-sans group"
            onMouseMove={handleMouseMove}
            onClick={handleScreenClick}
        >
            {/* Video */}
            <video
                ref={videoRef}
                className={`w-full h-full object-contain transition-all duration-300 ${showSidebar && !isMobile ? 'pr-80' : ''}`}
                playsInline
                autoPlay
                preload="auto"
                crossOrigin="anonymous"
                onClick={(e) => { e.stopPropagation(); handleScreenClick(); }}
                onDoubleClick={toggleFullscreen}
            />

            {/* Top Bar (Back Button) */}
            <div 
                className={`absolute top-0 left-0 w-full p-6 flex justify-between items-start transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                onClick={(e) => { e.stopPropagation(); handleScreenClick(); }}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); handleClose(); }}
                    className="p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors backdrop-blur-md group-hover:scale-110 pointer-events-auto"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            {/* Loading Spinner */}
            {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 bg-black/50 backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600/30 border-t-blue-600 mb-4"></div>
                    <span className="text-white font-medium text-sm tracking-wide">
                        Chargement...
                    </span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
                    <div className="text-center p-6 bg-red-500/10 border border-red-500/50 rounded-xl">
                        <p className="text-red-500 text-lg font-semibold">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            )}

            {/* Center Controls (Play/Pause) - Only show if not loading */}
            {!isLoading && !error && (
                <div 
                    className={`absolute inset-0 flex items-center justify-center gap-12 z-10 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    onClick={(e) => { e.stopPropagation(); handleScreenClick(); }}
                >
                    {/* Prev Channel (Desktop) */}
                    {!isMobile && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); handlePrevChannel(); }}
                            className="p-4 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all pointer-events-auto"
                        >
                            <ChevronLeft className="w-10 h-10" />
                        </button>
                    )}

                    {/* Play/Pause */}
                    <button 
                        className="w-14 h-14 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-black/40 hover:scale-105 hover:border-white/40 transition-all duration-300 cursor-pointer pointer-events-auto group/play"
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    >
                        {isPlaying ? (
                            <svg className="w-7 h-7 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" />
                            </svg>
                        ) : (
                            <svg className="w-7 h-7 text-white ml-1 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                            </svg>
                        )}
                    </button>

                    {/* Next Channel (Desktop) */}
                    {!isMobile && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleNextChannel(); }}
                            className="p-4 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all pointer-events-auto"
                        >
                            <ChevronRight className="w-10 h-10" />
                        </button>
                    )}
                </div>
            )}

            {/* Bottom Controls */}
            <div
                className={`absolute bottom-0 left-0 w-full pt-12 pb-6 px-6 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'} ${showSidebar && !isMobile ? 'pr-80' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Channel Logo / Name */}
                <div className="mb-4 flex items-center">
                     {channelLogo ? (
                        <img 
                            src={channelLogo} 
                            alt={channelName || 'Channel'} 
                            className="h-8 md:h-12 w-auto object-contain drop-shadow-md"
                            onError={(e) => {(e.target as HTMLImageElement).style.display = 'none';}}
                        />
                     ) : (
                        <div className="text-white/90 font-medium text-lg drop-shadow-md">
                            {channelName || 'Live TV'}
                        </div>
                     )}
                </div>

                {/* Progress Bar (Visual only for Live TV) */}
                <div className="w-full mb-4 flex items-center gap-4">
                    <span className="text-red-500 font-bold uppercase tracking-wider animate-pulse text-xs">
                        Live
                    </span>
                    <div className="relative flex-1 h-1.5 bg-white/20 rounded-full">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full opacity-80" />
                    </div>
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {/* Volume Control */}
                        <div className="flex items-center gap-3 group/volume relative">
                            <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors focus:outline-none drop-shadow-md">
                                {volume === 0 ? (
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M3.75 3.75L20.25 20.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M11.25 5.25L6.75 9.75H3.75V14.25H6.75L11.25 18.75V5.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M11.25 5.25L6.75 9.75H3.75V14.25H6.75L11.25 18.75V5.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M15.5 8.5C16.5 9.5 16.5 14.5 15.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </button>
                            <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 ease-out">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={volume}
                                    onChange={handleVolumeChange}
                                    className="w-20 h-1 ml-2 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                        </div>

                         {/* Audio Settings */}
                         {audioTracks.length > 1 && (
                            <div className="relative">
                                <button 
                                    onClick={() => setShowAudioMenu(!showAudioMenu)}
                                    className="text-white hover:text-blue-400 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15V6" />
                                        <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                                        <path d="M12 12H3" />
                                        <path d="M16 6H3" />
                                        <path d="M12 18H3" />
                                    </svg>
                                </button>
                                {showAudioMenu && (
                                    <div className="absolute bottom-full left-0 mb-2 bg-black/90 border border-white/10 rounded-lg p-2 min-w-[150px] backdrop-blur-md">
                                        <div className="text-xs font-bold text-gray-400 mb-2 px-2">Audio</div>
                                        {audioTracks.map((track, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleAudioTrackChange(index)}
                                                className={`w-full text-left px-2 py-1.5 rounded text-xs ${currentAudioTrack === index ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
                                            >
                                                {track.name || `Piste ${index + 1}`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Sidebar Toggle (Bottom Right) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowSidebar(!showSidebar); }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors backdrop-blur-md pointer-events-auto ${showSidebar ? 'bg-blue-600 text-white' : 'text-white hover:bg-white/10'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                            <span className="font-medium text-sm hidden md:inline">Chaînes</span>
                        </button>

                        {/* Fullscreen */}
                        <button 
                            onClick={toggleFullscreen}
                            className="text-white hover:text-blue-400 transition-colors focus:outline-none drop-shadow-md transform hover:scale-110"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Sidebar List (Original Logic Preserved) */}
            <div 
                onClick={(e) => e.stopPropagation()}
                className={`fixed right-0 top-0 bottom-0 w-80 bg-[#111827] border-l border-white/10 z-[60] flex flex-col transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="p-4 border-b border-white/10 space-y-3">
                    {/* Sélecteur de Playlist */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-400 whitespace-nowrap">Playlist :</span>
                        <div className="relative flex-1">
                            <button
                                onClick={() => {
                                    setIsPlaylistDropdownOpen(!isPlaylistDropdownOpen);
                                    setIsGroupDropdownOpen(false);
                                }}
                                className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 hover:bg-white/10 transition-all text-white text-xs font-medium"
                            >
                                {selectedPlaylist ? (
                                    <div className="flex items-center gap-3 truncate">
                                        <img
                                            src={getCountryFlagUrl(selectedPlaylist.countryCode)}
                                            alt={selectedPlaylist.countryName}
                                            className="w-6 h-4 object-cover rounded shadow-sm flex-shrink-0"
                                        />
                                        <span className="truncate text-sm">{selectedPlaylist.countryName}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 truncate">Sélectionner</span>
                                )}
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-1 ${isPlaylistDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isPlaylistDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#111827] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30">
                                    {playlists.map((playlist) => (
                                        <button
                                            key={playlist.id}
                                            onClick={() => {
                                                setSelectedPlaylist(playlist);
                                                setIsPlaylistDropdownOpen(false);
                                            }}
                                            className={`relative w-full flex items-center gap-4 pl-4 pr-3 py-2.5 hover:bg-white/5 transition-colors text-xs text-left ${selectedPlaylist?.id === playlist.id
                                                ? 'bg-blue-500/10 text-blue-200'
                                                : 'text-gray-300'
                                                }`}
                                        >
                                            {selectedPlaylist?.id === playlist.id && (
                                                <div className="absolute left-0.5 top-1/2 -translate-y-1/2 h-4 w-1 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
                                            )}
                                            <img
                                                src={getCountryFlagUrl(playlist.countryCode)}
                                                alt={playlist.countryName}
                                                className="w-6 h-4 object-cover rounded shadow-sm flex-shrink-0"
                                            />
                                            <span className="truncate text-sm">{playlist.countryName}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30">
                    {isLoadingChannels ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="text-gray-400 text-sm">Chargement...</span>
                        </div>
                    ) : (
                        filteredChannels.map((channel) => (
                            <div
                                key={channel.id}
                                onClick={() => handleChannelClick(channel)}
                                className={`relative flex items-center gap-4 pl-4 pr-2 py-2 rounded-lg cursor-pointer transition-colors group overflow-hidden ${channel.url === channelUrl ? 'bg-blue-500/10' : 'hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                {channel.url === channelUrl && (
                                    <div className="absolute left-0.5 top-1/2 -translate-y-1/2 h-5 w-1 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.6)]"></div>
                                )}
                                <div className="w-10 h-6 md:w-12 md:h-8 flex items-center justify-center bg-black/20 rounded overflow-hidden flex-shrink-0">
                                    {channel.logo ? (
                                        <img src={channel.logo} alt={channel.name} className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <span className="text-xs text-gray-500 font-bold">TV</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-medium truncate ${channel.url === channelUrl ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'
                                        }`}>
                                        {cleanChannelName(channel.name)}
                                    </h4>
                                    {channel.url === channelUrl && (
                                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                            En cours
                                        </span>
                                    )}
                                </div>
                                {channel.url === channelUrl && (
                                    <div className="text-red-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
