'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { ExpandableButton } from './ExpandableButton';
import { API_BASE_URL } from '../../utils/config';
import { addToMyList, removeFromMyList, isInMyList } from '../../utils/myListUtils';

interface MovieDetailsProps {
    movie: any;
    onClose: () => void;
    userCountry?: string;
    onPlay?: () => void;
    allMovies?: any[];
}

export const MovieDetails = ({ movie, onClose, userCountry = 'France', onPlay, allMovies = [] }: MovieDetailsProps) => {
    const router = useRouter();
    const [isLiked, setIsLiked] = useState(false);
    const [isInList, setIsInList] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'description' | 'cast' | 'similaires'>('description');
    const [similarMovies, setSimilarMovies] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'similaires') {
            // 1. Try to filter locally from allMovies
            if (allMovies && allMovies.length > 0 && movie) {
                const currentGenres = movie.genres || movie.category || '';
                // Get primary genre (first one before comma)
                const primaryGenre = typeof currentGenres === 'string' ? currentGenres.split(',')[0].trim() : '';

                if (primaryGenre) {
                    const filtered = allMovies.filter(m => {
                        // Exclude current movie logic (handle both number and string IDs)
                        if (String(m.id) === String(movie.id)) return false;

                        const mGenres = m.genres || m.category || '';
                        // Check if starts with same genre
                        return typeof mGenres === 'string' &&
                            mGenres.toLowerCase().trim().startsWith(primaryGenre.toLowerCase());
                    });

                    // Randomize and take 6
                    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
                    setSimilarMovies(shuffled.slice(0, 6));
                    return;
                }
            }

            // 2. Fallback to API if local failed
            if (similarMovies.length === 0 && movie?.tmdbId) {
                fetch(`${API_BASE_URL}/movies/${movie.tmdbId}/similar`, {
                    credentials: 'include'
                })
                    .then(res => res.json())
                    .then(data => setSimilarMovies(data))
                    .catch(err => {
                        // Failed to fetch similar movies
                    });
            }
        }
    }, [activeTab, movie, allMovies]);

    useEffect(() => {
        const checkListStatus = async () => {
            if (movie?.id) {
                // 1. Try cache first for immediate feedback
                const cachedListStr = sessionStorage.getItem('netfix_mylist_cache');
                if (cachedListStr) {
                    try {
                        const cachedList = JSON.parse(cachedListStr);
                        // Check if movie is in cached list (handle string/number id mismatch)
                        const isCached = cachedList.some((m: any) => m.id == movie.id);
                        setIsInList(isCached);
                    } catch (e) {
                        // Silent cache error
                    }
                }

                // 2. Verify with server
                const inList = await isInMyList(movie.id);
                setIsInList(inList);
            }
        };
        checkListStatus();
    }, [movie]);

    const handleMyListToggle = async () => {
        if (!movie) return;

        const newState = !isInList;
        setIsInList(newState); // Optimistic update

        // Update Cache immediately
        try {
            const cachedListStr = sessionStorage.getItem('netfix_mylist_cache');
            let cachedList = cachedListStr ? JSON.parse(cachedListStr) : [];

            if (newState) {
                // Add to cache if not present
                if (!cachedList.some((m: any) => m.id == movie.id)) {
                    cachedList.push(movie);
                }
            } else {
                // Remove from cache
                cachedList = cachedList.filter((m: any) => m.id != movie.id);
            }
            sessionStorage.setItem('netfix_mylist_cache', JSON.stringify(cachedList));
        } catch (e) {
            // Ignore cache update error
        }

        if (newState) {
            const success = await addToMyList(movie);
            if (!success) setIsInList(!newState); // Revert on failure
        } else {
            const success = await removeFromMyList(movie.id);
            if (!success) setIsInList(!newState); // Revert on failure
        }
    };

    // Helper functions (same as Hero.tsx)
    const formatDuration = (minutes: number) => {
        if (!minutes) return '';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const formatVotes = (count: number) => {
        if (!count) return '0';
        if (count >= 1000000) return (count / 1000000).toFixed(1).replace('.0', '') + 'M';
        if (count >= 1000) return (count / 1000).toFixed(2).replace('.00', '') + 'K';
        return count.toString();
    };

    const renderStars = (voteAverage: number) => {
        let rating = Math.min(voteAverage || 0, 5);
        if (rating % 1 > 0) {
            rating = Math.floor(rating) + 0.5;
        }

        return (
            <>
                {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="relative w-4 h-4">
                        {/* Background Star (Gray/Transparent) */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="absolute inset-0 w-full h-full text-gray-600/40"
                        >
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>

                        {/* Foreground Star (Yellow - Clipped for half stars) */}
                        <div
                            className="absolute inset-0 overflow-hidden"
                            style={{
                                width: star <= rating ? '100%' : (star - 0.5 === rating ? '50%' : '0%')
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-full h-full text-amber-400"
                            >
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                ))}
            </>
        );
    };

    if (!movie) return null;

    // Normalize Data (API vs Mock)
    const backdropImage = movie.backdropPath || movie.image;
    const logoImage = movie.logoPath || movie.logo;
    const title = movie.title;
    const overview = movie.overview || movie.description || "Aucune description disponible.";
    const voteAverage = movie.voteAverage || movie.rating || 0;
    const voteCount = movie.voteCount || 0;
    const releaseDate = movie.releaseDate ? new Date(movie.releaseDate) : (movie.year ? new Date(movie.year, 0, 1) : null);
    const releaseYear = releaseDate ? releaseDate.getFullYear() : '';
    const duration = movie.duration; // API provides minutes
    const genres = movie.genres || movie.category;

    const isAvailable = Boolean(movie.videoUrl || movie.url);
    const [isRequested, setIsRequested] = useState(false);

    // Modal States
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);

    const [notificationPrefs, setNotificationPrefs] = useState({
        email: true,
        whatsapp: false,
        telegram: false
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleRequestAdd = () => {
        setIsRequestModalOpen(true);
    };

    const submitRequest = async () => {
        if (!movie) return;
        setRequestLoading(true);

        try {
            const tmdbIdToUse = movie.tmdbId || movie.id;
            const parsedTmdbId = parseInt(String(tmdbIdToUse), 10);
            const posterPath = movie.posterPath || movie.poster_path || movie.image || null;

            const res = await fetch(`${API_BASE_URL}/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    tmdbId: parsedTmdbId,
                    title: movie.title,
                    posterPath: posterPath,
                    preferences: notificationPrefs
                })
            });

            if (res.ok) {
                setIsRequested(true);
                setIsRequestModalOpen(false);
                setIsSuccessModalOpen(true);
            } else {
                const err = await res.text();
                console.error('Failed to request movie', res.status, err);
            }
        } catch (e) {
            console.error('Error requesting movie:', e);
        } finally {
            setRequestLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-gray-900 shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 z-30 rounded-full bg-black/60 p-2 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                    <Icon icon="solar:close-circle-linear" width={28} />
                </button>

                <div className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${backdropImage}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full px-4 sm:px-6 md:px-10 pt-4 sm:pt-6 md:pt-10 pb-2 sm:pb-4">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-full max-w-[140px] sm:max-w-[180px] md:max-w-[240px] mb-4 sm:mb-6 md:mb-8 md:mt-auto"
                        >
                            {logoImage ? (
                                <img
                                    src={logoImage}
                                    alt={title}
                                    className="w-full h-auto object-contain drop-shadow-2xl"
                                />
                            ) : (
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white drop-shadow-xl">{title}</h2>
                            )}
                        </motion.div>

                        {/* Top 10 Badge */}
                        {movie.isTop10 && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.25 }}
                                className="flex items-center gap-3 mb-4"
                            >
                                <div className="flex flex-col items-center justify-center w-9 h-9 bg-[#E50914] rounded-[2px] shadow-sm">
                                    <span className="text-[0.55rem] font-black text-white leading-none tracking-tighter">TOP</span>
                                    <span className="text-[1.1rem] font-black text-white leading-none -mt-0.5">10</span>
                                </div>
                                <span className="text-lg font-bold text-white tracking-wide drop-shadow-md">
                                    N° {movie.rank || 1} en {userCountry} aujourd'hui
                                </span>
                            </motion.div>
                        )}



                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className={`flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 ${!isAvailable ? 'w-full sm:w-auto flex-nowrap' : 'flex-wrap'}`}>
                            {/* Bouton Lecture */}
                            <button
                                onClick={onPlay}
                                disabled={!isAvailable}
                                className={`flex items-center justify-center gap-2 rounded-lg px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-bold text-white transition-all shadow-lg min-h-[44px]
                                    ${!isAvailable
                                        ? 'flex-1 sm:flex-none bg-gray-600/50 cursor-not-allowed opacity-50'
                                        : 'bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 cursor-pointer shadow-blue-500/20'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={`${!isAvailable ? '' : 'group-hover:scale-110'} transition-transform`}>
                                    <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                                </svg>
                                <span>{!isAvailable ? 'Indisponible' : 'Lecture'}</span>
                            </button>

                            {/* Bouton Ma Liste */}
                            {isAvailable && (
                                <button
                                    onClick={handleMyListToggle}
                                    className={`flex items-center justify-center gap-2 rounded-lg border px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md min-h-[44px]
                                        ${isInList
                                            ? 'bg-green-600/20 border-green-500 text-green-400 hover:bg-green-600/30'
                                            : 'border-gray-400/30 bg-white/10 text-white hover:bg-white/20 hover:border-gray-400'
                                        }`}
                                >
                                    {isInList ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
                                        </svg>
                                    )}
                                    <span className="hidden sm:inline">{isInList ? 'Retirer de ma liste' : 'Ajouter à ma liste'}</span>
                                    <span className="sm:hidden">{isInList ? 'Retirer' : 'Ma liste'}</span>
                                </button>
                            )}



                            {/* Boutons secondaires desktop uniquement (Just Like/Heart left) */}
                            {isAvailable && (
                                <div className="hidden md:flex gap-3">
                                    <ExpandableButton
                                        icon={isLiked ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17a15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                                        )}
                                        label={isLiked ? 'Aimé' : 'J\'aime'}
                                        onClick={() => setIsLiked(!isLiked)}
                                        shakeOnClick={true}
                                        activeIconColor={isLiked ? 'text-red-500' : undefined}
                                        height="44px"
                                    />
                                </div>
                            )}

                            {/* Bouton Demande si indisponible */}
                            {!isAvailable && (
                                <button
                                    onClick={!isRequested ? handleRequestAdd : undefined}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg border px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold transition-all cursor-pointer min-h-[44px]
                                        ${isRequested
                                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                            : 'bg-white/10 border-gray-400/30 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {isRequested ? (
                                        <><Icon icon="solar:check-circle-bold" width={20} /><span>Demande envoyée</span></>
                                    ) : (
                                        <><Icon icon="solar:add-circle-linear" width={20} /><span className="hidden sm:inline">Faire une demande d'ajout</span><span className="sm:hidden">Demander</span></>
                                    )}
                                </button>
                            )}
                        </motion.div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-10 p-4 sm:p-6 md:p-10 pt-0 -mt-4 sm:-mt-6 relative z-10">
                    <div className="md:col-span-2 space-y-6">

                        <div className="hidden md:flex flex-col gap-4 mb-6">
                            {/* Metadata Row: DESKTOP ONLY */}
                            <div className="flex items-center gap-6 text-sm font-bold text-gray-300">
                                <span className="flex items-center gap-2 text-green-400">
                                    {Math.round(voteAverage * 10)}% Recommandé
                                </span>
                                <span className="flex items-center gap-2">
                                    <Icon icon="solar:calendar-linear" width={16} /> {releaseYear}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Icon icon="solar:clock-circle-linear" width={16} /> {duration ? formatDuration(duration) : '2h 15m'}
                                </span>
                                <span className="rounded border border-white/20 bg-white/5 px-2 py-0.5 text-xs text-white">4K HDR</span>
                            </div>

                            {/* Stars Rating: DESKTOP ONLY */}
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-500 border-2 border-gray-800 shadow-md"></div>
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-500 border-2 border-gray-800 shadow-md"></div>
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-500 to-lime-500 border-2 border-gray-800 shadow-md"></div>
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 border-2 border-gray-800 shadow-md"></div>
                                </div>
                                <div className="flex items-center text-amber-400 space-x-1">
                                    {renderStars(voteAverage)}
                                </div>
                                <div className="text-xs font-medium text-gray-300">
                                    <span className="text-white font-bold">{voteAverage.toFixed(1)}</span> · {formatVotes(voteCount)} Votes
                                </div>
                            </div>
                        </div>
                        {/* Tabs - 3 onglets sur mobile */}
                        <div className="flex items-center gap-3 sm:gap-6 mb-4 pb-2 overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`text-xs sm:text-sm font-bold pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'description' ? 'text-white border-white' : 'text-gray-400 border-transparent hover:text-gray-200'}`}
                            >
                                Description
                            </button>

                            <button
                                onClick={() => setActiveTab('similaires')}
                                className={`text-xs sm:text-sm font-bold pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'similaires' ? 'text-white border-white' : 'text-gray-400 border-transparent hover:text-gray-200'}`}
                            >
                                Films similaires
                            </button>
                        </div>

                        {activeTab === 'description' ? (
                            <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <p className={`text-gray-300 text-xs sm:text-sm leading-relaxed transition-all duration-300 ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                                    {overview}
                                </p>
                                <button
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    className="mt-2 text-xs font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                                >
                                    {isDescriptionExpanded ? 'Voir moins' : 'En savoir plus'}
                                    <Icon icon={isDescriptionExpanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} width={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex md:grid md:grid-cols-6 overflow-x-auto md:overflow-visible gap-2 pb-2 md:pb-0 scrollbar-hide animate-in fade-in slide-in-from-right-2 duration-300">
                                {similarMovies.length > 0 ? (
                                    similarMovies.slice(0, 6).map((m: any) => (
                                        <div key={m.id} className="min-w-[22%] sm:min-w-[20%] md:min-w-0 relative aspect-[2/3] bg-gray-800 rounded-md overflow-hidden group cursor-pointer shadow-lg hover:ring-2 hover:ring-white/50 transition-all">
                                            {(m.posterPath || m.image) ? (
                                                <img src={m.posterPath || m.image} alt={m.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-[10px] sm:text-xs p-2 text-center bg-gray-900">No Image</div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full md:col-span-6 flex items-center justify-center h-24 text-gray-500 text-xs">
                                        Aucun film similaire trouvé
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-1 space-y-6 text-sm">
                        <div className="space-y-1">
                            <span className="block text-gray-500 font-medium">Classification</span>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-base">
                                    {movie.certification || (movie.adult ? '18+' : 'TP')}
                                </span>
                                <span className="text-gray-400 text-xs">Recommandé pour les {movie.certification ? movie.certification.replace('+', '') : (movie.adult ? '18' : 'tous')} ans et plus</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <span className="block text-gray-500 font-medium">Cast</span>
                            <div className="flex items-center -space-x-3">
                                {movie.cast ? (
                                    /* Try parsing if it's a JSON string (from backend) */
                                    (() => {
                                        try {
                                            const castData = typeof movie.cast === 'string' ? JSON.parse(movie.cast) : movie.cast;
                                            // Handle both array of objects or simple array
                                            const castArray = Array.isArray(castData) ? castData : [];

                                            if (castArray.length === 0) return <span className="text-gray-400">Aucun casting disponible</span>;

                                            const visibleCast = castArray.slice(0, 7);
                                            const remainingCount = Math.max(0, castArray.length - 7);

                                            return (
                                                <>
                                                    {visibleCast.map((actor: any, i: number) => {
                                                        // Handle TMDB structure vs simple structure
                                                        const imgUrl = actor.profile_path
                                                            ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                                                            : (actor.profilePath || actor.img || 'https://via.placeholder.com/100?text=Actor');
                                                        const name = actor.name || actor.original_name || 'Inconnu';
                                                        const isLast = i === visibleCast.length - 1;

                                                        return (
                                                            <div key={i} className="group relative">
                                                                <div className="h-14 w-14 rounded-full border-2 border-gray-900 overflow-hidden shadow-sm bg-gray-800 cursor-pointer transition-transform hover:scale-110 hover:z-10 relative">
                                                                    <img
                                                                        src={imgUrl}
                                                                        alt={name}
                                                                        className="h-full w-full object-cover"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Actor';
                                                                        }}
                                                                    />
                                                                </div>

                                                                {/* Remaining Count Badge */}
                                                                {isLast && remainingCount > 0 && (
                                                                    <div className="absolute -bottom-1 -right-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 ring-4 ring-gray-900">
                                                                        <span className="text-[10px] font-bold text-white">+{remainingCount}</span>
                                                                    </div>
                                                                )}

                                                                {/* Tooltip */}
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                                                    {name}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                </>
                                            );
                                        } catch (e) {
                                            console.error("Cast parsing error", e);
                                            return <span className="text-gray-400">Erreur chargement casting</span>;
                                        }
                                    })()
                                ) : (
                                    <span className="text-gray-400">Aucun casting disponible</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="block text-gray-500 font-medium">Genres</span>
                            <span className="block text-white text-base">{genres}</span>
                        </div>

                    </div>
                </div>
            </motion.div>

            {/* Request Notification Modal */}
            {
                mounted && isRequestModalOpen && createPortal(
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsRequestModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden"
                        >
                            {/* Background Gradient */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none" />

                            {/* Header */}
                            <div className="p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between relative z-10">
                                <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2.5">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                        <Icon icon="solar:rocket-2-bold-duotone" width={24} />
                                    </div>
                                    Demande Prioritaire
                                </h3>
                                <button
                                    onClick={() => setIsRequestModalOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer group"
                                >
                                    <Icon icon="solar:close-circle-linear" width={24} className="text-gray-400 group-hover:text-white transition-colors" />
                                </button>
                            </div>

                            <div className="p-4 md:p-8 relative z-10">
                                <p className="text-gray-400 text-xs mb-4 md:mb-6 leading-relaxed">
                                    Comment souhaitez-vous être notifié une fois que votre demande pour <span className="text-white font-bold">"{title}"</span> aura été approuvée ?
                                </p>

                                <div className="flex items-center justify-between gap-2 w-full">
                                    <button
                                        onClick={() => setNotificationPrefs({ email: true, whatsapp: false, telegram: false })}
                                        className={`relative flex-1 flex items-center justify-center gap-1.5 px-2 h-14 rounded-lg border transition-all cursor-pointer group ${notificationPrefs.email
                                            ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-400 hover:text-white'}`}
                                    >
                                        {notificationPrefs.email && (
                                            <div className="absolute -top-2 -right-2 bg-[#0A0A0A] border border-blue-500 rounded-full p-0.5 text-blue-500">
                                                <Icon icon="solar:check-circle-bold" width={14} />
                                            </div>
                                        )}
                                        <Icon icon="solar:letter-bold" width={20} className="text-gray-400 group-hover:text-white" />
                                        <span className="text-xs font-bold text-gray-400 group-hover:text-white">Email</span>
                                    </button>

                                    <button
                                        onClick={() => setNotificationPrefs({ email: false, whatsapp: true, telegram: false })}
                                        className={`relative flex-1 flex items-center justify-center gap-1.5 px-2 h-14 rounded-lg border transition-all cursor-pointer group ${notificationPrefs.whatsapp
                                            ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-400 hover:text-white'}`}
                                    >
                                        {notificationPrefs.whatsapp && (
                                            <div className="absolute -top-2 -right-2 bg-[#0A0A0A] border border-green-500 rounded-full p-0.5 text-green-500">
                                                <Icon icon="solar:check-circle-bold" width={14} />
                                            </div>
                                        )}
                                        <Icon icon="logos:whatsapp-icon" width={20} />
                                        <span className="text-xs font-bold text-gray-400 group-hover:text-white">WhatsApp</span>
                                    </button>

                                    <button
                                        onClick={() => setNotificationPrefs({ email: false, whatsapp: false, telegram: true })}
                                        className={`relative flex-1 flex items-center justify-center gap-1.5 px-2 h-14 rounded-lg border transition-all cursor-pointer group ${notificationPrefs.telegram
                                            ? 'border-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.1)]'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-400 hover:text-white'}`}
                                    >
                                        {notificationPrefs.telegram && (
                                            <div className="absolute -top-2 -right-2 bg-[#0A0A0A] border border-sky-500 rounded-full p-0.5 text-sky-500">
                                                <Icon icon="solar:check-circle-bold" width={14} />
                                            </div>
                                        )}
                                        <Icon icon="logos:telegram" width={20} />
                                        <span className="text-xs font-bold text-gray-400 group-hover:text-white">Telegram</span>
                                    </button>
                                </div>

                                {/* Warning & Settings Link */}
                                <div className="mt-6 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-start gap-3">
                                    <Icon icon="solar:info-circle-bold" className="text-yellow-500/80 min-w-[18px] mt-0.5" width={18} />
                                    <div className="flex-1">
                                        <p className="text-gray-400 text-xs leading-relaxed">
                                            Par défaut, les notifications sont envoyées par <strong>Email</strong>. Pour recevoir les notifications via <strong className="text-sky-400">Telegram</strong> ou <strong className="text-green-400">WhatsApp</strong>, assurez-vous d'avoir configuré vos identifiants dans les paramètres.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setIsRequestModalOpen(false);
                                                router.push('/dashboard/settings');
                                            }}
                                            className="mt-2 text-xs font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-1.5 group/link cursor-pointer"
                                        >
                                            <Icon icon="solar:settings-bold" width={14} />
                                            Configurer mes paramètres
                                            <Icon icon="solar:arrow-right-linear" width={12} className="group-hover/link:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 md:p-6 border-t border-white/10 bg-white/[0.02] relative z-10">
                                <button
                                    onClick={submitRequest}
                                    disabled={requestLoading || (!notificationPrefs.email && !notificationPrefs.whatsapp && !notificationPrefs.telegram)}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer"
                                >
                                    {requestLoading ? (
                                        <>
                                            <Icon icon="svg-spinners:ring-resize" width={20} />
                                            <span>Traitement en cours...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Envoyer la demande</span>
                                            <Icon icon="solar:arrow-right-linear" width={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )
            }



            {/* Success Modal */}
            {
                mounted && isSuccessModalOpen && createPortal(
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsSuccessModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] pointer-events-none" />

                            <div className="p-8 text-center relative z-10">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)] animate-in zoom-in duration-300">
                                    <Icon icon="solar:verified-check-bold" width={40} className="text-green-500 drop-shadow-sm" />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3">Demande reçue !</h3>

                                <p className="text-gray-400 text-sm leading-relaxed mb-8 px-4">
                                    Votre demande est en cours de traitement, vous serez notifié une fois la demande traitée.
                                    <br />
                                    <span className="text-white/40 text-xs mt-3 block font-medium">Temps moyen: 5 à 12 heures</span>
                                </p>

                                <button
                                    onClick={() => setIsSuccessModalOpen(false)}
                                    className="w-full py-3.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/5 active:scale-95"
                                >
                                    Continuer
                                </button>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )
            }
        </motion.div >
    );
};
