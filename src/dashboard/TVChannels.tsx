'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from './Components/Navbar';
import { API_BASE_URL } from '../utils/config';
import { getCountryFlagUrl } from '../utils/countries';
import { ChevronDown, Search, Tv } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
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
}

export const TVChannels = () => {
    const router = useRouter();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
    const [isLoadingChannels, setIsLoadingChannels] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Playlists
    useEffect(() => {
        const fetchPlaylists = async () => {
            // 1. Try cache first
            const cachedPlaylists = sessionStorage.getItem('netfix_playlists_cache');
            if (cachedPlaylists) {
                try {
                    const parsed = JSON.parse(cachedPlaylists);
                    setPlaylists(parsed);
                    const activePlaylists = parsed.filter((p: Playlist) => p.isActive);
                    if (activePlaylists.length > 0 && !selectedPlaylist) {
                        setSelectedPlaylist(activePlaylists[0]);
                    }
                    setIsLoadingPlaylists(false);
                } catch (e) { }
            }

            // 2. Fetch fresh data
            try {
                const response = await fetch(`${API_BASE_URL}/playlists`);
                if (response.ok) {
                    const data = await response.json();
                    const activePlaylists = data.filter((p: Playlist) => p.isActive);
                    setPlaylists(activePlaylists);
                    sessionStorage.setItem('netfix_playlists_cache', JSON.stringify(activePlaylists));

                    if (activePlaylists.length > 0 && !selectedPlaylist) {
                        setSelectedPlaylist(activePlaylists[0]);
                    }
                }
            } catch (error) {
                console.error('Error fetching playlists:', error);
            } finally {
                setIsLoadingPlaylists(false);
            }
        };

        fetchPlaylists();
    }, []);

    // Fetch Channels when playlist changes
    useEffect(() => {
        if (!selectedPlaylist) return;

        const fetchChannels = async () => {
            if (!selectedPlaylist) return;

            const cacheKey = `netfix_channels_${selectedPlaylist.id}`;
            const cachedChannelsStr = sessionStorage.getItem(cacheKey);
            const cachedChannels = cachedChannelsStr ? JSON.parse(cachedChannelsStr) : null;

            if (cachedChannels) {
                setChannels(cachedChannels);
            } else {
                setIsLoadingChannels(true);
            }

            try {
                const response = await fetch(`${API_BASE_URL}/playlists/${selectedPlaylist.id}/channels`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setChannels(data);
                    sessionStorage.setItem(cacheKey, JSON.stringify(data));
                } else {
                    if (!cachedChannels) setChannels([]);
                }
            } catch (error) {
                console.error('Error fetching channels:', error);
                if (!cachedChannels) setChannels([]);
            } finally {
                setIsLoadingChannels(false);
            }
        };

        fetchChannels();
    }, [selectedPlaylist]);

    // Filter channels
    const filteredChannels = channels.filter(channel =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black bg-fixed text-white pb-20">
            <Navbar />

            <div className="pt-20 sm:pt-24 px-3 sm:px-4 md:px-16 lg:px-24 pb-16 sm:pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6 mb-6 sm:mb-8 border-b border-white/10 pb-4 sm:pb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3 mb-2">
                            Chaînes TV
                        </h1>
                        <p className="text-sm sm:text-base text-gray-400">
                            Sélectionnez un pays de votre choix.
                        </p>
                    </div>

                    {/* Playlist Selector & Search */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Rechercher une chaîne..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 h-12 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full sm:w-64 h-12 flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 hover:bg-white/10 transition-all"
                            >
                                {selectedPlaylist ? (
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={getCountryFlagUrl(selectedPlaylist.countryCode)}
                                            alt={selectedPlaylist.countryName}
                                            className="w-6 h-4 object-cover rounded shadow-sm"
                                        />
                                        <span className="font-medium">{selectedPlaylist.countryName}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-400">Sélectionner un pays</span>
                                )}
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-full bg-[#111827] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                                    {playlists.map((playlist) => (
                                        <button
                                            key={playlist.id}
                                            onClick={() => {
                                                setSelectedPlaylist(playlist);
                                                setIsDropdownOpen(false);
                                                setSearchQuery('');
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${selectedPlaylist?.id === playlist.id ? 'bg-blue-500/10 text-blue-400' : ''}`}
                                        >
                                            <img
                                                src={getCountryFlagUrl(playlist.countryCode)}
                                                alt={playlist.countryName}
                                                className="w-8 h-6 object-cover rounded shadow-sm"
                                            />
                                            <span className="font-medium">{playlist.countryName}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                {isLoadingChannels ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredChannels.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
                        {filteredChannels.map((channel) => (
                            <motion.div
                                key={channel.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => router.push(`/watch/tv?url=${encodeURIComponent(channel.url)}&name=${encodeURIComponent(channel.name)}&logo=${encodeURIComponent(channel.logo || '')}&playlistId=${selectedPlaylist?.id}`)}
                                className="group relative bg-white/5 border border-white/5 rounded-lg sm:rounded-xl overflow-hidden aspect-video hover:border-blue-500/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-blue-500/10"
                                title={channel.name} // Native tooltip for accessibility
                            >
                                <div className="absolute inset-0 p-2 sm:p-3 md:p-4 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                    {channel.logo ? (
                                        <img
                                            src={channel.logo}
                                            alt={channel.name}
                                            className="max-w-full max-h-full object-contain drop-shadow-lg"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : null}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="relative flex flex-col items-center justify-center min-h-[70vh] text-center z-10">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6 }}
                            className="max-w-2xl mx-auto flex flex-col items-center"
                        >
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10 shadow-xl">
                                <Tv className="w-9 h-9 text-white/80 opacity-80" />
                            </div>

                            <h2 className="text-xl md:text-2xl font-bold mb-4 text-white tracking-wide">
                                {selectedPlaylist ? "Aucune chaîne trouvée" : "Chaînes TV"}
                            </h2>

                            <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto font-light mb-8">
                                {selectedPlaylist
                                    ? "Il semble qu'il n'y ait aucune chaîne disponible pour cette playlist actuellement."
                                    : "Veuillez sélectionner un pays dans le menu ci-dessus pour accéder à la liste des chaînes de télévision en direct."}
                            </p>

                            <div className="pt-2">
                                <span className="inline-block h-px w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};
