import React, { useState } from 'react';
import {
    Search,
    X,
    ChevronLeft,
    Upload,
    Image as ImageIcon,
    FileText,
    Users,
    Clock,
    Hash,
    ChevronDown,
    Link,
    Star,
    Calendar,
    AlertTriangle,
    Film,
    Plus,
    Loader2
} from 'lucide-react';
import { API_BASE_URL } from '../../../utils/config';

interface MovieModalProps {
    onClose: () => void;
    onBack: () => void;
    onSuccess?: () => void;
}

const MovieModal: React.FC<MovieModalProps> = ({ onClose, onBack, onSuccess }) => {
    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<any>({
        tmdbId: null,
        title: '',
        originalTitle: '',
        overview: '',
        posterPath: '',
        backdropPath: '',
        logoPath: '',
        releaseDate: '',
        duration: 0,
        voteAverage: 0,
        voteCount: 0,
        genres: '',
        certification: '',
        cast: [],
        videoUrl: '',
        displayOption: 'standard' // standard, hero, top10, both
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/movies/search?query=${encodeURIComponent(searchQuery)}`, {
                credentials: 'include'
            });
            const data = await res.json();
            setSearchResults(data);
            setShowResults(true);
        } catch (err) {
            setError("Erreur lors de la recherche TMDB");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectMovie = async (movie: any) => {
        setIsSearching(true);
        setShowResults(false);
        try {
            const res = await fetch(`${API_BASE_URL}/movies/tmdb/${movie.id}`);
            const details = await res.json();
            
            // Format Duration (min -> Xh Ym)
            const h = Math.floor(details.duration / 60);
            const m = details.duration % 60;
            const durationStr = `${h}h ${m < 10 ? '0' + m : m}`;

            setFormData({
                ...formData,
                tmdbId: details.tmdbId,
                title: details.title,
                originalTitle: details.originalTitle,
                overview: details.overview,
                posterPath: details.posterPath,
                backdropPath: details.backdropPath,
                logoPath: details.logoPath,
                releaseDate: details.releaseDate ? new Date(details.releaseDate).getFullYear() : '',
                duration: durationStr,
                voteAverage: details.voteAverage,
                voteCount: details.voteCount,
                genres: details.genres,
                certification: details.certification,
                cast: details.cast || [],
            });
        } catch (err) {
            setError("Impossible de récupérer les détails du film");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.videoUrl) {
            setError("Veuillez entrer le lien M3U8 du film");
            return;
        }

        setIsSubmitting(true);
        try {
            // Parse duration back to minutes
            let durationInt = 0;
            if (typeof formData.duration === 'string') {
                const match = formData.duration.match(/(\d+)h\s*(\d+)?/);
                if (match) {
                    durationInt = parseInt(match[1]) * 60 + (match[2] ? parseInt(match[2]) : 0);
                } else {
                    durationInt = parseInt(formData.duration) || 0;
                }
            } else {
                durationInt = formData.duration;
            }

            const payload = { 
                ...formData, 
                duration: durationInt,
                isHero: formData.displayOption === 'hero' || formData.displayOption === 'both',
                isTop10: formData.displayOption === 'top10' || formData.displayOption === 'both'
            };

            const res = await fetch(`${API_BASE_URL}/movies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

            if (res.ok) {
                if (onSuccess) onSuccess();
                onClose();
            } else {
                setError("Erreur lors de l'enregistrement du film");
            }
        } catch (err) {
            setError("Erreur réseau");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden w-full transition-all duration-300 max-w-6xl h-[90vh]">

                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-bold text-white">
                            Nouveau Film
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="h-full p-8 overflow-y-auto pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    <div className="space-y-8">
                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto mb-10 relative z-50">
                            <div className="relative">
                                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Rechercher un film par titre (TMDB)..."
                                    className="w-full bg-slate-800 border border-slate-700 text-white pl-12 pr-24 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500"
                                />
                                <button 
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rechercher'}
                                </button>
                            </div>

                            {/* Search Results Dropdown */}
                            {showResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-96 overflow-y-auto z-50">
                                    {searchResults.map((movie) => (
                                        <div 
                                            key={movie.id}
                                            onClick={() => handleSelectMovie(movie)}
                                            className="flex items-center gap-4 p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 last:border-0"
                                        >
                                            {movie.poster_path ? (
                                                <img 
                                                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} 
                                                    alt={movie.title} 
                                                    className="w-12 h-18 object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-12 h-18 bg-slate-600 rounded flex items-center justify-center">
                                                    <Film className="w-6 h-6 text-slate-400" />
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-medium text-white">{movie.title}</h4>
                                                <p className="text-sm text-slate-400">
                                                    {movie.release_date?.split('-')[0]} • Note: {movie.vote_average?.toFixed(1)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5" />
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-12 gap-8">
                            {/* Left Column: Visuals & Core Info */}
                            <div className="col-span-12 lg:col-span-7 space-y-6">
                                {/* Row 1: Visuals (Poster, Backdrop, Logo) */}
                                <div className="flex flex-col sm:flex-row gap-4 h-48">
                                    {/* Poster */}
                                    <div className="w-32 shrink-0 space-y-2 h-full flex flex-col">
                                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" /> Affiche
                                        </label>
                                        <div className="flex-1 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer group relative overflow-hidden">
                                            {formData.posterPath ? (
                                                <img src={formData.posterPath} alt="Poster" className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                                        <Upload className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                                                        <span className="text-xs font-medium text-center px-1">Poster</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Backdrop */}
                                    <div className="flex-1 space-y-2 h-full flex flex-col">
                                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" /> Couverture
                                        </label>
                                        <div className="flex-1 w-full bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer group relative overflow-hidden">
                                            {formData.backdropPath ? (
                                                <img src={formData.backdropPath} alt="Backdrop" className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                                        <Upload className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                                                        <span className="text-xs font-medium">Backdrop</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Logo */}
                                    <div className="w-40 shrink-0 space-y-2 h-full flex flex-col">
                                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" /> Logo
                                        </label>
                                        <div className="flex-1 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer group relative overflow-hidden">
                                            {formData.logoPath ? (
                                                <div className="relative w-full h-full p-2 flex items-center justify-center">
                                                    <img src={formData.logoPath} alt="Logo" className="w-full h-full object-contain" />
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                                        <Upload className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                                                        <span className="text-xs font-medium">Logo</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>


                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Synopsis / Description
                                    </label>
                                    <textarea 
                                        rows={4} 
                                        value={formData.overview}
                                        onChange={(e) => setFormData({...formData, overview: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none resize-none" 
                                        placeholder="Résumé du film..." 
                                    />
                                </div>

                                {/* Row 3: Stream URL */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                        <Link className="w-4 h-4" /> URL du Flux (m3u8)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.videoUrl}
                                        onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none" 
                                        placeholder="https://example.com/movie.m3u8" 
                                    />
                                </div>
                            </div>

                            {/* Right Column: Metadata & Details */}
                            <div className="col-span-12 lg:col-span-5 space-y-6">
                                {/* Stats Grid */}
                                <div className="space-y-5">
                                    {/* Title & Score Row */}
                                    <div className="grid grid-cols-12 gap-4">
                                        <div className="col-span-8 space-y-2">
                                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                                <Film className="w-4 h-4" /> Titre
                                            </label>
                                            <input 
                                                type="text" 
                                                value={formData.title}
                                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none" 
                                                placeholder="Titre..." 
                                            />
                                        </div>
                                        <div className="col-span-4 space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Votes</label>
                                            <div className="relative">
                                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                                <input 
                                                    type="text" 
                                                    value={formData.voteCount || ''}
                                                    onChange={(e) => setFormData({...formData, voteCount: parseInt(e.target.value) || 0})}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none text-center" 
                                                    placeholder="1250" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Technical Specs Row (Year, Duration, Age) */}
                                    <div className="grid grid-cols-12 gap-3">
                                        <div className="space-y-2 col-span-3">
                                            <label className="text-sm font-medium text-slate-300 truncate">Année</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                                <input 
                                                    type="text" 
                                                    value={formData.releaseDate}
                                                    onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-2 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none text-sm" 
                                                    placeholder="2024" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 col-span-3">
                                            <label className="text-sm font-medium text-slate-300 truncate">Durée</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                                <input 
                                                    type="text" 
                                                    value={formData.duration || ''}
                                                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-2 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none text-sm" 
                                                    placeholder="2h 15" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 col-span-6">
                                            <label className="text-sm font-medium text-slate-300 truncate">Age</label>
                                            <div className="relative">
                                                <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                                                <select 
                                                    value={formData.certification}
                                                    onChange={(e) => setFormData({...formData, certification: e.target.value})}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none cursor-pointer text-sm"
                                                >
                                                    <option value="">Sélectionner</option>
                                                    <option value="Tous publics">Tous publics</option>
                                                    <option value="10+">10+</option>
                                                    <option value="12+">12+</option>
                                                    <option value="16+">16+</option>
                                                    <option value="18+">18+</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Genre & Category */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                            <Hash className="w-4 h-4" /> Genre
                                        </label>
                                        <input 
                                            type="text" 
                                            value={formData.genres}
                                            onChange={(e) => setFormData({...formData, genres: e.target.value})}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none" 
                                            placeholder="ex: Sci-Fi Noir" 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Option d'affichage</label>
                                            <div className="relative">
                                                <select 
                                                    value={formData.displayOption}
                                                    onChange={(e) => setFormData({...formData, displayOption: e.target.value})}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none cursor-pointer"
                                                >
                                                    <option value="standard">Standard</option>
                                                    <option value="hero">Section Héros</option>
                                                    <option value="top10">Top 10</option>
                                                    <option value="both">Héros & Top 10</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Note</label>
                                            <div className="relative">
                                                <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                                                <input 
                                                    type="text" 
                                                    value={formData.voteAverage || ''}
                                                    onChange={(e) => setFormData({...formData, voteAverage: parseFloat(e.target.value)})}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-2 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                                    placeholder="9.8" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actors */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Casting
                                    </label>
                                    <div className="flex gap-4 overflow-x-auto pb-2 items-center">
                                        {formData.cast && formData.cast.length > 0 ? (
                                            <>
                                                {formData.cast.slice(0, 5).map((actor: any, i: number) => (
                                                    <div key={i} className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer relative overflow-hidden group shrink-0" title={actor.name}>
                                                        {actor.profilePath ? (
                                                            <img src={actor.profilePath} alt={actor.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Users className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                ))}
                                                {formData.cast.length > 5 && (
                                                    <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-medium text-sm shrink-0">
                                                        +{formData.cast.length - 5}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            [1, 2, 3, 4, 5].map((i) => (
                                                <div key={i} className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 relative overflow-hidden shrink-0">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors font-medium border border-slate-700"
                                    >
                                        Annuler
                                    </button>
                                    <button 
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Publication...
                                            </>
                                        ) : (
                                            'Publier le Film'
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

export default MovieModal;
