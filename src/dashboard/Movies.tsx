'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from './Components/Navbar';
import { MovieGridCard } from './Components/MovieGridCard';
import { MovieDetails } from './Components/MovieDetails';
import MoviePlayer from './Components/MoviePlayer';
import { AnimatePresence, motion } from 'framer-motion';
import { API_BASE_URL } from '../utils/config';
import { Film } from 'lucide-react';

export const Movies = () => {
    const [selectedMovie, setSelectedMovie] = useState<any>(null);
    const [movies, setMovies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userCountry, setUserCountry] = useState<string>('France');
    const [playingMovie, setPlayingMovie] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchUserCountry = async () => {
            let dbCountry = null;
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
                // Cache parse error
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.user && data.user.country) {
                        dbCountry = data.user.country;
                        setUserCountry(dbCountry);
                        localStorage.setItem('netfix_user_data', JSON.stringify(data.user));
                    }
                }
            } catch (error) {
                // Failed to fetch user country from DB
            }

            if (!dbCountry || dbCountry === 'France') {
                try {
                    const ipResponse = await fetch('https://ipapi.co/json/');
                    if (ipResponse.ok) {
                        const ipData = await ipResponse.json();
                        if (ipData.country_code) {
                            const frenchName = new Intl.DisplayNames(['fr'], { type: 'region' }).of(ipData.country_code);
                            if (frenchName) {
                                setUserCountry(frenchName);
                            }
                        }
                    }
                } catch (error) {
                    // IP Geolocation failed
                }
            }
        };

        fetchUserCountry();
    }, []);

    useEffect(() => {
        const fetchMovies = async () => {
            // 1. Try to load from cache first for immediate display
            const cachedMovies = sessionStorage.getItem('netfix_movies_cache');
            if (cachedMovies) {
                try {
                    setMovies(JSON.parse(cachedMovies));
                    setLoading(false);
                } catch (e) {
                    // Cache parse error
                }
            }

            // 2. Fetch fresh data
            try {
                const response = await fetch(`${API_BASE_URL}/movies`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setMovies(data);
                    // Update cache
                    sessionStorage.setItem('netfix_movies_cache', JSON.stringify(data));
                }
            } catch (error) {
                // Failed to fetch movies
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
        ...movie,
        id: movie.id,
        title: movie.title,
        image: movie.posterPath || movie.image,
        rating: movie.voteAverage,
        year: movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : (movie.year || 2024),
        category: movie.genres || 'Inconnu',
        duration: movie.duration
    });

    const mappedMovies = movies.map(mapMovieToCard);
    const filteredMovies = searchQuery
        ? mappedMovies.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : mappedMovies;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black bg-fixed text-white pb-20">
            <Navbar onSearch={setSearchQuery} />

            <div className="pt-24 px-4 md:px-16 lg:px-24 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3 mb-2">
                            Films
                        </h1>
                        <p className="text-gray-400">
                            Explorez notre collection complète de films.
                        </p>
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredMovies.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-4 md:gap-6">
                        {filteredMovies.map((movie) => (
                            <MovieGridCard
                                key={movie.id}
                                {...movie}
                                onClick={() => setSelectedMovie(movie)}
                            />
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
                                <Film className="w-9 h-9 text-white/80 opacity-80" />
                            </div>

                            <h2 className="text-xl md:text-2xl font-bold mb-4 text-white tracking-wide">
                                Aucun film trouvé
                            </h2>

                            <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto font-light mb-8">
                                Il semble qu'il n'y ait aucun film disponible pour le moment.
                            </p>

                            <div className="pt-2">
                                <span className="inline-block h-px w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></span>
                            </div>
                        </motion.div>
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
                    />
                )}
            </AnimatePresence>

            {playingMovie && (
                <MoviePlayer movie={playingMovie} onClose={() => setPlayingMovie(null)} />
            )}
        </div>
    );
};
