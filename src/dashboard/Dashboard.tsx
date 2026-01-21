'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Hero } from './Components/Hero';
import { ContentRow } from './Components/ContentRow';
import { Navbar } from './Components/Navbar';
import { MovieDetails } from './Components/MovieDetails';
import MoviePlayer from './Components/MoviePlayer';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { API_BASE_URL } from '../utils/config';
import { useSearchParams } from 'next/navigation';
import { DonationModal } from './Components/DonationModal';

export default function Dashboard() {
    const [selectedMovie, setSelectedMovie] = useState<any>(null);
    const [movies, setMovies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [userCountry, setUserCountry] = useState<string>('France');
    const [playingMovie, setPlayingMovie] = useState<any>(null);
    const [sportIndex, setSportIndex] = useState(0);
    const sportImages = [
        "/footbal.jpg",
        "/Is-NBA-League-Pass-Worth-It-1024x576.png",
        "/5-WCH.webp"
    ];
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setSportIndex((prev) => (prev + 1) % sportImages.length);
        }, 30000); // 30 seconds interval
        return () => clearInterval(interval);
    }, []);

    const searchParams = useSearchParams();
    const movieIdParam = searchParams.get('movieId');
    const tmdbIdParam = searchParams.get('tmdbId');

    useEffect(() => {
        const fetchUserCountry = async () => {
            let dbCountry = null;

            // 1. Try to get from cache first for immediate display
            try {
                const cachedData = localStorage.getItem('netfix_user_data');
                if (cachedData) {
                    const user = JSON.parse(cachedData);
                    if (user.country) {
                        dbCountry = user.country;
                        setUserCountry(dbCountry);
                    }
                }
            } catch (e) {
                console.error("Cache parse error", e);
            }

            // 2. Fetch from DB to get authoritative data
            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    const userData = data.user || data;

                    if (userData && userData.country) {
                        dbCountry = userData.country;
                        setUserCountry(dbCountry);
                        // Update cache
                        localStorage.setItem('netfix_user_data', JSON.stringify(userData));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user country from DB", error);
            }

            // 3. Fallback: IP Geolocation
            // If DB/Cache didn't return a country, OR if it returned 'France' (default) and we want to verify real location
            // This solves the issue where user is in Italy but DB says France.
            if (!dbCountry || dbCountry === 'France') {
                try {
                    const ipResponse = await fetch('https://ipapi.co/json/');
                    if (ipResponse.ok) {
                        const ipData = await ipResponse.json();
                        if (ipData.country_code) {
                            // Translate country code (e.g., 'IT') to French name (e.g., 'Italie')
                            const frenchName = new Intl.DisplayNames(['fr'], { type: 'region' }).of(ipData.country_code);
                            if (frenchName) {
                                setUserCountry(frenchName);
                            }
                        }
                    }
                } catch (error) {
                    console.warn("IP Geolocation failed", error);
                }
            }
        };

        fetchUserCountry();
    }, []);

    useEffect(() => {
        const fetchMovies = async () => {
            setLoading(true); // Ensure loading state starts true

            // 1. Try to load from cache first for immediate display
            const cachedMovies = sessionStorage.getItem('netfix_movies_cache');
            if (cachedMovies) {
                try {
                    setMovies(JSON.parse(cachedMovies));
                    setLoading(false);
                } catch (e) {
                    console.error("Cache parse error", e);
                }
            }

            // 2. Fetch fresh data
            try {
                const response = await fetch(`${API_BASE_URL}/movies`);
                if (response.ok) {
                    const data = await response.json();
                    setMovies(data);
                    // Update cache
                    sessionStorage.setItem('netfix_movies_cache', JSON.stringify(data));
                }
            } catch (error) {
                console.error("Failed to fetch movies", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, []);

    const handlePlayMovie = (movie: any) => {
        setPlayingMovie(movie);
        setSelectedMovie(null);
    };

    const mapMovieToCard = (movie: any) => ({
        // Pass full movie object for details first
        ...movie,
        id: movie.id,
        title: movie.title,
        image: movie.posterPath || movie.image, // Use posterPath for vertical card
        rating: movie.voteAverage,
        year: movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : (movie.year || 2024),
        category: movie.genres || 'Inconnu',
        duration: movie.duration
    });

    // Handle Deep Link from Notification or Search
    const handledMovieId = useRef<string | null>(null);

    useEffect(() => {
        const handleDeepLink = async () => {
            // 1. Handle Local Movie ID (from notifications)
            if (movieIdParam && movies.length > 0) {
                // Prevent loop if we already handled this ID
                if (handledMovieId.current === movieIdParam) return;

                const movie = movies.find(m => m.id.toString() === movieIdParam);
                if (movie) {
                    const mappedMovie = mapMovieToCard(movie);
                    setSelectedMovie(mappedMovie);
                    handledMovieId.current = movieIdParam;

                    // Use history API to avoid Router refresh/loop
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('movieId');
                    window.history.replaceState({}, '', newUrl.toString());
                }
            }
            // 2. Handle TMDB ID (from search)
            else if (tmdbIdParam) {
                if (handledMovieId.current === `tmdb-${tmdbIdParam}`) return;

                // Check if we have it locally first
                const localMovie = movies.find(m => m.tmdbId === parseInt(tmdbIdParam));

                if (localMovie) {
                    const mappedMovie = mapMovieToCard(localMovie);
                    setSelectedMovie(mappedMovie);
                } else {
                    // Fetch from TMDB via backend
                    setDetailsLoading(true);
                    try {
                        const res = await fetch(`${API_BASE_URL}/movies/tmdb/${tmdbIdParam}`, {
                            credentials: 'include'
                        });
                        if (res.ok) {
                            const tmdbMovie = await res.json();
                            // Map TMDB detail to Card format
                            const mappedMovie = {
                                id: tmdbMovie.tmdbId, // Use TMDB ID as temporary ID
                                tmdbId: tmdbMovie.tmdbId,
                                title: tmdbMovie.title,
                                overview: tmdbMovie.overview,
                                image: tmdbMovie.posterPath,
                                backdropPath: tmdbMovie.backdropPath,
                                logoPath: tmdbMovie.logoPath,
                                rating: tmdbMovie.voteAverage,
                                year: tmdbMovie.releaseDate ? new Date(tmdbMovie.releaseDate).getFullYear() : new Date().getFullYear(),
                                category: tmdbMovie.genres || 'Inconnu',
                                duration: tmdbMovie.duration,
                                videoUrl: null, // No video for non-local movies
                                cast: tmdbMovie.cast, // Array of actors
                                certification: tmdbMovie.certification,
                                releaseDate: tmdbMovie.releaseDate,
                                voteAverage: tmdbMovie.voteAverage,
                                voteCount: tmdbMovie.voteCount,
                                genres: tmdbMovie.genres || 'Inconnu'
                            };
                            setSelectedMovie(mappedMovie);
                        }
                    } catch (e) {
                        console.error("Failed to fetch TMDB details", e);
                    } finally {
                        setDetailsLoading(false);
                    }
                }

                handledMovieId.current = `tmdb-${tmdbIdParam}`;
                // Cleanup URL
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('tmdbId');
                window.history.replaceState({}, '', newUrl.toString());
            }
        };

        handleDeepLink();
    }, [movieIdParam, tmdbIdParam, movies]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // --- Filtering Logic with Mutual Exclusivity ---

    // 1. Independent Sets (Can overlap with genres)
    const moviesMoment = [...movies]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(mapMovieToCard);

    const trendingMovies = [...movies]
        .sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0))
        .slice(0, 10)
        .map(mapMovieToCard);

    const top10France = movies.filter(movie =>
        movie.isTop10 ||
        (movie.genres && movie.genres.toLowerCase().includes('top 10'))
    ).slice(0, 10).map(mapMovieToCard);

    // Map of Top 10 Ranks for consistency across all views
    const top10RankMap = new Map();
    top10France.forEach((movie, index) => {
        top10RankMap.set(movie.id, index + 1);
    });

    const onSelectMovie = (movie: any) => {
        // Handle movie selection with rank consistency
        const rank = top10RankMap.get(movie.id);
        if (rank) {
            // If movie is in Top 10, enforce its rank and status
            setSelectedMovie({ ...movie, rank, isTop10: true });
        } else {
            setSelectedMovie(movie);
        }
    };

    // 2. Exclusive Genre Sets (Waterfall)
    // We track IDs to ensure a movie appears in only ONE genre row (Priority: Top10 -> Family -> Horror -> Fantasy -> Comedy -> Action)
    const genreUsedIds = new Set<string | number>();

    // Initialize with Top 10 movies to exclude them from other categories
    top10France.forEach(movie => genreUsedIds.add(movie.id));

    const getExclusiveMovies = (filterFn: (m: any) => boolean) => {
        const result = movies.filter(m => {
            if (genreUsedIds.has(m.id)) return false;
            if (filterFn(m)) {
                return true;
            }
            return false;
        });
        // Mark as used
        result.forEach(m => genreUsedIds.add(m.id));
        return result.slice(0, 10).map(mapMovieToCard);
    };

    // Priority 1: Enfants et Familles
    const familyMovies = getExclusiveMovies(m =>
        m.genres && (
            m.genres.toLowerCase().includes('famille') ||
            m.genres.toLowerCase().includes('animation') ||
            m.genres.toLowerCase().includes('enfant')
        )
    );

    // Priority 2: Horreur
    const horrorMovies = getExclusiveMovies(m =>
        m.genres && m.genres.toLowerCase().includes('horreur')
    );

    // Priority 3: Action (Moved up to capture Action/Sci-Fi mixes)
    const actionMovies = getExclusiveMovies(m =>
        m.genres && m.genres.toLowerCase().includes('action')
    );

    // Priority 4: Science-Fiction & Aventure (Replaces Fantastique)
    const scifiAdventureMovies = getExclusiveMovies(m =>
        m.genres && (
            m.genres.toLowerCase().includes('science-fiction') ||
            m.genres.toLowerCase().includes('science fiction') ||
            m.genres.toLowerCase().includes('sci-fi') ||
            m.genres.toLowerCase().includes('aventure')
        )
    );

    // Priority 5: Comédie
    const comedyMovies = getExclusiveMovies(m =>
        m.genres && m.genres.toLowerCase().includes('comédie')
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pb-20">
            <Navbar />
            <Hero
                onDetailsClick={(movie) => setSelectedMovie(movie)}
                userCountry={userCountry}
                onPlay={(movie) => handlePlayMovie(movie)}
                top10Movies={top10France}
            />

            <div className="relative z-20 pt-16 sm:pt-20 md:pt-24 lg:pt-32 pb-16 sm:pb-20 bg-gradient-to-b from-gray-900 to-black space-y-0">
                {/* Dual Banner Section (Donation & Sport) */}
                <div className="w-full px-3 sm:px-4 pb-8 sm:pb-10">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">

                        {/* Main Premium Banner (Large) - 3 columns (60%) */}
                        <div className="lg:col-span-3 relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#08090e] border border-white/10 shadow-2xl group min-h-[220px] sm:min-h-[260px] md:min-h-[300px]">
                            {/* Dynamic Background */}
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-[#08090e] to-[#08090e]" />
                            </div>

                            {/* Content */}
                            <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-center h-full max-w-lg">

                                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3 tracking-tight">
                                    Une expérience de streaming <span className="text-blue-400">sans aucune limite</span>
                                </h3>

                                <p className="text-xs sm:text-sm md:text-base text-gray-400 mb-3 sm:mb-4 md:mb-6 leading-relaxed max-w-sm">
                                    Accès illimité aux films, séries, animés et chaînes TV en direct. Qualité 4K HDR sans compromis.
                                </p>

                                <div className="flex flex-wrap items-center gap-4">
                                    <button
                                        onClick={() => setIsDonationModalOpen(true)}
                                        className="group cursor-pointer px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-[#e53965] hover:bg-[#d62f58] text-white font-bold rounded-lg sm:rounded-xl transition-all hover:scale-105 shadow-lg shadow-[#e53965]/20 flex items-center gap-2 text-xs sm:text-sm md:text-base min-h-[44px]"
                                    >
                                        <span>Faire un don</span>
                                        <Icon icon="solar:hand-heart-bold" className="w-6 h-6 -rotate-12 transition-transform group-hover:scale-110" />
                                    </button>
                                    <div className="text-white font-bold text-lg ml-2">
                                        0€ <span className="text-xs text-gray-400 font-normal">/mois</span>
                                    </div>
                                </div>
                            </div>

                            {/* Visual on the right - Extended with Fade & Blur */}
                            <div className="absolute right-0 top-0 bottom-0 w-2/3 hidden md:block overflow-hidden rounded-r-3xl">
                                <div className="relative w-full h-full">
                                    <img
                                        src="/Nextmovie.jpg"
                                        alt="Films & Séries"
                                        className="w-full h-full object-cover object-center"
                                    />

                                    {/* Complex Gradient Mask & Blur Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#08090e] via-[#08090e]/80 to-transparent" />
                                    <div className="absolute inset-y-0 left-0 w-1/3 backdrop-blur-[2px]" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#08090e]/50 to-transparent" />
                                </div>
                            </div>
                        </div>

                        {/* Secondary Banner (Sport Images) - 2 columns (40%) */}
                        <div className="lg:col-span-2 relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#08090e] border border-white/10 shadow-2xl group min-h-[220px] sm:min-h-[260px] md:min-h-[300px]">
                            <AnimatePresence mode='wait'>
                                <motion.img
                                    key={sportIndex}
                                    src={sportImages[sportIndex]}
                                    alt="Sports Live"
                                    initial={{ opacity: 0, scale: 1.05 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 3.0, ease: "easeInOut" }}
                                    className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                                />
                            </AnimatePresence>

                            {/* Gradients - Enhanced Depth Effect */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#08090e] via-[#08090e]/60 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#08090e] via-[#08090e]/50 to-transparent" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-[#08090e] via-transparent to-transparent opacity-80" />

                            {/* Content Inside Image - Bottom Position */}
                            <div className="absolute bottom-0 left-0 p-4 sm:p-6 md:p-8 w-full z-20">
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-2 drop-shadow-2xl">
                                    Vivez le meilleur <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                                        Du Sport
                                    </span>
                                </h3>
                                <p className="text-gray-300 text-xs sm:text-sm md:text-sm max-w-md line-clamp-2 leading-relaxed opacity-90">
                                    Ligue 1, Champions League, NBA, UFC... Ne ratez plus aucun événement majeur.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
                {/* 1. Tendances (High Rating) */}
                {trendingMovies.length > 0 && (
                    <div className="mb-0">
                        <h2 className="text-sm sm:text-lg font-bold text-white px-4 mb-0">Tendances</h2>
                        <ContentRow title="Tendances" data={trendingMovies} onMovieSelect={onSelectMovie} />
                    </div>
                )}

                {/* 2. Top 10 des films */}
                {top10France.length > 0 && (
                    <div className="mb-0">
                        <div className="flex items-center gap-3 px-4 mb-2">
                            <div className="flex flex-col items-center justify-center w-8 h-8 bg-[#E50914] rounded-[2px] shadow-sm">
                                <span className="text-[0.5rem] font-black text-white leading-none tracking-tighter">TOP</span>
                                <span className="text-[1.0rem] font-black text-white leading-none -mt-0.5">10</span>
                            </div>
                            <span className="text-sm sm:text-xl font-bold text-white tracking-wide drop-shadow-md">
                                Top 10 des films en {userCountry} aujourd'hui
                            </span>
                        </div>
                        <ContentRow title={`Top 10 ${userCountry}`} data={top10France} onMovieSelect={onSelectMovie} showRank={true} />
                    </div>
                )}

                {/* 3. Films d'action */}
                {actionMovies.length > 0 && (
                    <div className="mb-0">
                        <h2 className="text-sm sm:text-lg font-bold text-white px-4 mb-0">Action</h2>
                        <ContentRow title="Action" data={actionMovies} onMovieSelect={onSelectMovie} />
                    </div>
                )}



                {/* 5. Films d'horreur */}
                {horrorMovies.length > 0 && (
                    <div className="mb-0">
                        <h2 className="text-sm sm:text-lg font-bold text-white px-4 mb-0">Horreur</h2>
                        <ContentRow title="Horreur" data={horrorMovies} onMovieSelect={onSelectMovie} />
                    </div>
                )}

                {/* 6. Animation (Ex-Enfants et familles) */}
                {familyMovies.length > 0 && (
                    <div className="mb-0">
                        <h2 className="text-sm sm:text-lg font-bold text-white px-4 mb-0">Animation</h2>
                        <ContentRow title="Animation" data={familyMovies} onMovieSelect={onSelectMovie} />
                    </div>
                )}

                {/* 7. Aventure/Fantastique */}
                {scifiAdventureMovies.length > 0 && (
                    <div className="mb-0">
                        <h2 className="text-sm sm:text-lg font-bold text-white px-4 mb-0">Fantastique & Aventure</h2>
                        <ContentRow title="Aventure" data={scifiAdventureMovies} onMovieSelect={onSelectMovie} />
                    </div>
                )}

                {/* 8. Comédie (Last Position) */}
                {comedyMovies.length > 0 && (
                    <div className="mb-0">
                        <h2 className="text-sm sm:text-lg font-bold text-white px-4 mb-0">Comédie</h2>
                        <ContentRow title="Comédie" data={comedyMovies} onMovieSelect={onSelectMovie} />
                    </div>
                )}


            </div>

            <AnimatePresence>
                {selectedMovie && (
                    <MovieDetails
                        movie={selectedMovie}
                        onClose={() => setSelectedMovie(null)}
                        userCountry={userCountry}
                        onPlay={() => handlePlayMovie(selectedMovie)}
                        allMovies={movies}
                    />
                )}
            </AnimatePresence>

            {/* Loading Overlay for Details */}
            {detailsLoading && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            )}

            {playingMovie && (
                <MoviePlayer movie={playingMovie} onClose={() => setPlayingMovie(null)} />
            )}

            <DonationModal
                isOpen={isDonationModalOpen}
                onClose={() => setIsDonationModalOpen(false)}
            />
        </div>
    );
}
