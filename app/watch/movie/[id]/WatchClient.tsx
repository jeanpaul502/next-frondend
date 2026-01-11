'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import MoviePlayer from '@/dashboard/Components/MoviePlayer';
import { API_BASE_URL } from '@/utils/config';

interface WatchClientProps {
    id: string;
    movieData: any;
}

export default function WatchClient({ id, movieData }: WatchClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const autoplay = searchParams.get('autoplay') === 'true';

    const [movie, setMovie] = useState<any>(movieData); // Initialize with server data if available
    const [loading, setLoading] = useState(!movieData);
    const [error, setError] = useState<string | null>(null);

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [authChecking, setAuthChecking] = useState(true);

    // View State: 'landing' | 'watching'
    const [viewMode, setViewMode] = useState<'landing' | 'watching'>('landing');

    useEffect(() => {
        const init = async () => {
            // 1. Check Auth always
            try {
                const authRes = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
                if (authRes.ok) {
                    setIsAuthenticated(true);
                    // Handle Autoplay immediately to skip landing if requested
                    if (autoplay) {
                        setViewMode('watching');
                    }
                } else {
                    setIsAuthenticated(false);
                }
            } catch (e) {
                console.error("Auth check failed", e);
                setIsAuthenticated(false);
            } finally {
                setAuthChecking(false);
            }

            // 2. Fetch Movie if not provided via props (Server Side Failed or Direct Nav fallback)
            if (!movie) {
                try {
                    // Try UUID fetch
                    let response = await fetch(`${API_BASE_URL}/movies/${id}`);

                    if (!response.ok) {
                        // Try TMDB fetch fallback
                        const responseTmdb = await fetch(`${API_BASE_URL}/movies/tmdb/${id}`);
                        if (responseTmdb.ok) {
                            const data = await responseTmdb.json();
                            setMovie(data);
                            return; // Success
                        }
                        throw new Error('Film introuvable');
                    }

                    const data = await response.json();
                    setMovie(data);
                } catch (err) {
                    console.error("Error fetching movie:", err);
                    setError('Impossible de charger le film.');
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        init();
    }, [id, movie, autoplay]);

    const handleWatch = () => {
        if (isAuthenticated) {
            setViewMode('watching');
        } else {
            // Redirect to login with proper return URL
            const currentUrl = window.location.pathname;
            router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
        }
    };

    const handleLogin = () => {
        router.push('/login');
    };

    if (loading || authChecking) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white font-sans">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-400">Chargement...</p>
            </div>
        );
    }

    if (error || !movie) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white font-sans p-4 text-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold mb-2">Oups !</h1>
                <p className="text-gray-400 mb-6">{error || 'Film introuvable'}</p>
                <div className="flex gap-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 border border-gray-600 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                    >
                        Réessayer
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition-colors"
                    >
                        Retour à l'accueil
                    </button>
                </div>
            </div>
        );
    }

    // MODE: PLAYER
    if (viewMode === 'watching') {
        return (
            <div className="fixed inset-0 bg-black z-50">
                <MoviePlayer movie={movie} onClose={() => setViewMode('landing')} />
            </div>
        );
    }

    // MODE: LANDING (Shared Link View)
    const backdropImage = movie.backdropPath || movie.image;
    const logoImage = movie.logoPath || movie.logo;
    const title = movie.title;
    const overview = movie.overview || movie.description;
    const duration = movie.duration;
    const releaseYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : (movie.year || '');

    const formatDuration = (minutes: number) => {
        if (!minutes) return '';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-white font-sans overflow-x-hidden relative">
            {/* Background Hero */}
            <div className="absolute inset-0 h-[70vh] sm:h-[85vh] w-full">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${backdropImage}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-[#0F0F0F]/40 to-transparent" />
            </div>

            {/* Navbar Placeholder (Optional, simple back button) */}
            <nav className="absolute top-0 left-0 w-full p-6 z-50 flex justify-between items-center">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <Icon icon="solar:home-2-bold" className="text-white" />
                    <span className="text-sm font-bold">Accueil</span>
                </button>

                {!isAuthenticated && (
                    <button
                        onClick={handleLogin}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors shadow-lg shadow-blue-600/20"
                    >
                        Connexion
                    </button>
                )}
            </nav>

            {/* Content Container */}
            <div className="relative z-10 flex min-h-screen flex-col justify-center px-4 sm:px-6 md:px-16 lg:px-24">
                <div className="max-w-2xl w-full">
                    <div className="relative h-auto w-full mb-6 mt-20">
                        {/* Logo or Title */}
                        <div className="w-full max-w-[280px] lg:max-w-[350px] mb-2">
                            {logoImage ? (
                                <img
                                    src={logoImage}
                                    alt={title}
                                    className="w-full h-auto object-contain drop-shadow-2xl"
                                />
                            ) : (
                                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white drop-shadow-lg leading-tight">{title}</h1>
                            )}
                        </div>

                        {/* Metadata Row */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm font-bold text-gray-300 mt-4">
                            <span className="flex items-center gap-2 text-green-400 font-bold">
                                {movie.voteAverage ? Math.round(movie.voteAverage * 10) : 0}% Recommandé
                            </span>
                            <span className="flex items-center gap-2">
                                <Icon icon="solar:calendar-linear" width={16} /> {releaseYear}
                            </span>
                            <span className="flex items-center gap-2">
                                <Icon icon="solar:clock-circle-linear" width={16} /> {formatDuration(duration)}
                            </span>
                            <span className="flex items-center gap-2 text-white">
                                {movie.genres ? movie.genres.split(',').slice(0, 3).join(', ') : ''}
                            </span>
                            <span className="rounded border border-white/20 bg-white/5 px-2 py-0.5 text-xs text-white">4K HDR</span>
                        </div>

                        {/* Description */}
                        <div className="mt-4">
                            <p className="text-base text-gray-300 md:text-lg leading-relaxed font-light tracking-wide shadow-black drop-shadow-md">
                                {overview}
                            </p>
                        </div>

                        {/* Social Proof (Stars) */}
                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex -space-x-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-500 border-2 border-gray-800 shadow-md"></div>
                                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-500 border-2 border-gray-800 shadow-md"></div>
                                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-500 to-lime-500 border-2 border-gray-800 shadow-md"></div>
                                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 border-2 border-gray-800 shadow-md"></div>
                            </div>

                            <div className="flex items-center text-amber-400 space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => {
                                    const rating = Math.min(movie.voteAverage || 0, 5);
                                    let fillType = 'none';
                                    if (star <= rating) fillType = 'full';
                                    else if (star - 0.5 <= rating) fillType = 'half';

                                    return (
                                        <div key={star} className="relative">
                                            <Icon icon="solar:star-linear" width={16} className="text-amber-400" />
                                            {fillType !== 'none' && (
                                                <div className={`absolute inset-0 overflow-hidden ${fillType === 'half' ? 'w-1/2' : 'w-full'}`}>
                                                    <Icon icon="solar:star-bold" width={16} className="text-amber-400" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="text-xs font-medium text-gray-300">
                                <span className="text-white font-bold">{movie.voteAverage?.toFixed(1) || '0.0'}</span> · {movie.voteCount || 0} Votes
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4 relative z-20 mt-8">
                            {isAuthenticated ? (
                                <button
                                    onClick={handleWatch}
                                    className="group flex items-center gap-2 rounded-lg bg-blue-600 px-10 py-3 text-[15px] font-bold text-white transition-all hover:bg-blue-500 hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-blue-500/20"
                                >
                                    <Icon icon="solar:play-bold" width={24} className="group-hover:scale-110 transition-transform" />
                                    <span>Lecture</span>
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleWatch}
                                        className="group flex items-center gap-2 rounded-lg bg-blue-600 px-10 py-3 text-[15px] font-bold text-white transition-all hover:bg-blue-500 hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-blue-500/20"
                                    >
                                        <Icon icon="solar:play-bold" width={24} className="group-hover:scale-110 transition-transform" />
                                        <span>Regarder</span>
                                    </button>
                                    <button
                                        onClick={handleLogin}
                                        className="group flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md border-gray-400/30 bg-white/10 text-white hover:bg-white/20 hover:border-gray-400"
                                    >
                                        <span>Se connecter</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple Footer/Gradient Fade at bottom */}
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0F0F0F] to-transparent z-0 pointer-events-none" />
        </div>
    );
}
