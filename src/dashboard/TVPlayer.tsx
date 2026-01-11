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
                    videoRef.current?.play().catch(() => setIsPlaying(false));
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
                    videoRef.current?.play().catch(() => setIsPlaying(false));
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
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleScreenClick = () => {
        if (showSidebar) {
            setShowSidebar(false);
        } else {
            togglePlay();
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
        // Cela va déclencher le useEffect de l'initialisation du lecteur
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

    if (!channelUrl) return null;

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 bg-black z-50 group select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
                if (!showSidebar) setShowControls(false);
            }}
        >
            {/* Zone de clic pour l'écran de lecture */}
            <div
                className="absolute inset-0 z-0"
                onClick={handleScreenClick}
            >
                <video
                    ref={videoRef}
                    className={`h-full bg-black transition-all duration-300 ${isFullscreen
                        ? 'w-full object-contain'
                        : 'w-[100%] object-cover'
                        } ${showSidebar ? 'pr-80' : ''}`}
                    playsInline
                />
            </div>

            {/* En-tête avec bouton retour */}
            <div className={`w-full absolute top-0 right-0 left-0 pointer-events-none z-20 transition-all duration-500 ease-in-out ${showControls || !isPlaying || showSidebar ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
                }`}>
                <div className="absolute w-full transition-all z-10 top-0 left-0 right-0 h-[120px] bg-gradient-to-b to-transparent from-black/50"></div>
                <div className="relative z-20 p-8">
                    <div className="flex w-full justify-between items-center">
                        <div className="flex flex-row gap-4">
                            <div className="flex flex-row items-center">
                                <div className="pointer-events-auto flex flex-row items-center">
                                    <button
                                        className="flex items-center justify-center font-bold whitespace-nowrap relative overflow-hidden transition-all transform-gpu h-9 text-sm px-3 rounded-md text-white hover:text-gray-300 cursor-pointer gap-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/10"
                                        onClick={() => router.push('/channels')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m15 18-6-6 6-6" />
                                        </svg>
                                        Retour
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Indicateur de chargement */}
            {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-30 pointer-events-none">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
                    <div className="flex items-center gap-1">
                        <span className="text-white font-medium text-lg tracking-wider">Chargement</span>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Message d'erreur */}
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

            {/* Sidebar Liste des Chaînes */}
            <div className={`fixed right-0 top-0 bottom-0 w-80 bg-[#111827] border-l border-white/10 z-[60] flex flex-col transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : 'translate-x-full'
                }`}>
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
                                <div className="w-12 h-8 flex items-center justify-center bg-black/20 rounded overflow-hidden flex-shrink-0">
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

            {/* Contrôles */}
            <div className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ease-in-out z-20 ${(showControls || !isPlaying || showSidebar) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
                } ${showSidebar ? 'pr-80' : ''}`}>
                {/* Bande noire en bas */}
                <div className={`absolute w-full transition-all bottom-0 left-0 right-0 bg-black z-10 ${isFullscreen ? 'h-[calc(100%-90px)]' : 'h-[calc(100%-140px)]'
                    }`}></div>

                <div className="relative z-20 p-8 pt-2">
                    <div className="flex flex-col w-full justify-between md:gap-1.5">
                        {/* Titre et Badge Direct */}
                        <div className="flex justify-between mb-0" dir="ltr">
                            <div className="flex flex-row justify-between items-end w-full pointer-events-none">
                                <div className="w-full flex flex-row items-end">
                                    {channelLogo ? (
                                        <img
                                            src={channelLogo}
                                            alt={channelName || "Chaîne"}
                                            className="h-12 object-contain drop-shadow-lg"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <span className={`text-sm text-white drop-shadow-lg font-medium ml-3 mb-1`}>
                                        {channelName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-500 rounded-md shadow-lg animate-pulse">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">Direct</span>
                                </div>
                            </div>
                        </div>

                        {/* Barre de progression (Visuelle pour le design, pleine pour le direct) */}
                        <div className="flex items-center space-x-3 pointer-events-auto mb-0">
                            <div className="group relative w-full h-10 flex items-center select-none">
                                <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 w-full"
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Contrôles principaux */}
                        <div className="flex justify-between pointer-events-auto" dir="ltr">
                            <div className="flex items-center gap-3">
                                {/* Bouton Play/Pause */}
                                <div className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm rounded-md cursor-pointer text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 py-0 px-0">
                                    <button className="w-full h-full px-3 py-2.5 cursor-pointer" onClick={(e) => {
                                        e.stopPropagation();
                                        togglePlay();
                                    }}>
                                        {isPlaying ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Boutons Précédent/Suivant */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm rounded-md cursor-pointer text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 py-0 px-0 group/btn">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePrevChannel();
                                            }}
                                            className="w-full h-full px-3 flex items-center gap-1 group-hover/btn:scale-105 transition-transform duration-200 cursor-pointer"
                                            title="Chaîne précédente"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                            <span>Préc.</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm rounded-md cursor-pointer text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 py-0 px-0 group/btn">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNextChannel();
                                            }}
                                            className="w-full h-full px-3 flex items-center gap-1 group-hover/btn:scale-105 transition-transform duration-200 cursor-pointer"
                                            title="Chaîne suivante"
                                        >
                                            <span>Suiv.</span>
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Contrôle du volume */}
                                <div
                                    className="relative"
                                    onMouseEnter={() => setShowVolumeSlider(true)}
                                    onMouseLeave={() => setShowVolumeSlider(false)}
                                >
                                    <div className="justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm px-4 rounded-md text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 pointer-events-auto flex items-center py-0 pr-1 cursor-pointer">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleMute();
                                            }}
                                            className="pr-4 -ml-1 text-2xl text-white flex items-center cursor-pointer"
                                        >
                                            {isMuted || volume === 0 ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                    <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path>
                                                    <path d="M2 2l20 20"></path>
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                    <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path>
                                                    <path d="M16 9a5 5 0 0 1 0 6"></path>
                                                    <path d="M19.364 18.364a9 9 0 0 0 0-12.728"></path>
                                                </svg>
                                            )}
                                        </button>

                                        <div className={`linear -ml-2 overflow-hidden transition-[width,opacity,padding] duration-300 ${showVolumeSlider ? 'w-24 opacity-100 px-2' : 'w-0 opacity-0 px-0'
                                            }`}>
                                            <div className="flex h-10 w-full items-center">
                                                <div className="relative h-1 flex-1 rounded-full bg-white bg-opacity-25 cursor-pointer">
                                                    <div
                                                        className="absolute inset-y-0 left-0 flex items-center justify-end rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
                                                        style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                                                    >
                                                        <div className="absolute h-3 w-3 translate-x-1/2 rounded-full bg-white"></div>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.01"
                                                        value={isMuted ? 0 : volume}
                                                        onChange={handleVolumeChange}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Sélecteur Audio (si plusieurs pistes) */}
                                {audioTracks.length > 0 && (
                                    <div className="relative">
                                        <div className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm rounded-md cursor-pointer text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 px-0 py-0">
                                            <button
                                                className="w-full h-full px-3 flex items-center gap-1 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowAudioMenu(!showAudioMenu);
                                                    setShowQualityMenu(false);
                                                }}
                                                title="Pistes Audio"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                                    <line x1="12" y1="19" x2="12" y2="23"></line>
                                                    <line x1="8" y1="23" x2="16" y2="23"></line>
                                                </svg>
                                                <span className="text-xs font-bold ml-1">
                                                    {audioTracks[currentAudioTrack]?.lang?.toUpperCase() || `Audio ${currentAudioTrack + 1}`}
                                                </span>
                                            </button>
                                        </div>

                                        {showAudioMenu && (
                                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#1f1f1f] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                                                {audioTracks.map((track, index) => (
                                                    <button
                                                        key={index}
                                                        className={`w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors text-sm text-left ${currentAudioTrack === index ? 'bg-blue-500/10 text-blue-400' : 'text-gray-300'}`}
                                                        onClick={() => handleAudioTrackChange(index)}
                                                    >
                                                        <span>{track.name || track.lang || `Piste ${index + 1}`}</span>
                                                        {currentAudioTrack === index && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>

                            {/* Contrôles de droite */}
                            <div className="flex items-center gap-3">
                                {/* Indicateur de qualité */}
                                <div className="flex items-center justify-center font-bold px-3 bg-white/5 rounded-md text-xs text-white border border-white/10 shadow-sm backdrop-blur-sm h-10 cursor-pointer">
                                    {videoQualityLabel}
                                </div>
                                {/* Sélecteur de qualité */}
                                <div className="relative">
                                    <div className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm rounded-md cursor-pointer text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 px-0 py-0">
                                        <button
                                            className="w-full h-full px-3 flex items-center gap-1 cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowQualityMenu(!showQualityMenu);
                                            }}
                                            title="Qualité vidéo"
                                        >
                                            <Settings className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {showQualityMenu && (
                                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#1f1f1f] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                                            <button
                                                className={`w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors text-sm text-left ${currentLevel === -1 ? 'bg-blue-500/10 text-blue-400' : 'text-gray-300'}`}
                                                onClick={() => handleQualityChange(-1)}
                                            >
                                                <span>Auto</span>
                                                {currentLevel === -1 && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                            </button>
                                            {levels.map((level, index) => (
                                                <button
                                                    key={index}
                                                    className={`w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors text-sm text-left ${currentLevel === index ? 'bg-blue-500/10 text-blue-400' : 'text-gray-300'}`}
                                                    onClick={() => handleQualityChange(index)}
                                                >
                                                    <span>{level.height}p</span>
                                                    {currentLevel === index && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Fullscreen */}
                                <div className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm rounded-md cursor-pointer text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 px-0 py-0">
                                    <button className="w-full h-full px-3 cursor-pointer" onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFullscreen();
                                    }}>
                                        {isFullscreen ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                                <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
                                                <path d="M21 8v-3a2 2 0 0 0-2-2h-3"></path>
                                                <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
                                                <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                                <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
                                                <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
                                                <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
                                                <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
