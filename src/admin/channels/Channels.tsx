import React, { useState, useRef, useEffect } from 'react';
import {
    Plus,
    RefreshCw,
    Trash2,
    Globe,
    ChevronDown,
    Check,
    Link as LinkIcon,
    X,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Search,
    MoreVertical,
    Edit,
    Power,
    Ban,
    Filter
} from 'lucide-react';
import { countries, getCountryFlagUrl } from '../../utils/countries';
import { API_BASE_URL } from '../../utils/config';

// --- Types ---
interface Playlist {
    id: string;
    countryName: string;
    url: string;
    countryCode: string;
    isActive: boolean;
    createdAt: string;
}

const Channels = () => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showToggleModal, setShowToggleModal] = useState(false);
    const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
    const [playlistToToggle, setPlaylistToToggle] = useState<Playlist | null>(null);
    const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const menuRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // --- Actions ---
    const fetchPlaylists = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/playlists`);
            if (response.ok) {
                const data = await response.json();
                setPlaylists(data);
            } else {
                console.error('Failed to fetch playlists');
            }
        } catch (error) {
            console.error('Error fetching playlists:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlaylists();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddPlaylist = async (countryName: string, url: string, countryCode: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/playlists`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    countryName,
                    url,
                    countryCode,
                    name: countryName, // Optionally use country name as name
                    isActive: true
                }),
            });

            if (response.ok) {
                await fetchPlaylists();
                setShowPlaylistModal(false);
            } else {
                console.error('Failed to add playlist');
            }
        } catch (error) {
            console.error('Error adding playlist:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditPlaylist = async (countryName: string, url: string, countryCode: string) => {
        if (!playlistToEdit) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/playlists/${playlistToEdit.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    countryName,
                    url,
                    countryCode,
                    name: countryName,
                }),
                credentials: 'include'
            });

            if (response.ok) {
                await fetchPlaylists();
                setShowPlaylistModal(false);
                setPlaylistToEdit(null);
            } else {
                console.error('Failed to update playlist');
            }
        } catch (error) {
            console.error('Error updating playlist:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const confirmToggleStatus = async () => {
        if (!playlistToToggle) return;
        
        try {
            // Optimistic update
            setPlaylists(playlists.map(p => 
                p.id === playlistToToggle.id ? { ...p, isActive: !p.isActive } : p
            ));

            const response = await fetch(`${API_BASE_URL}/playlists/${playlistToToggle.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isActive: !playlistToToggle.isActive
                }),
            });

            if (response.ok) {
                setShowToggleModal(false);
                setPlaylistToToggle(null);
            } else {
                // Revert if failed
                await fetchPlaylists();
                console.error('Failed to toggle status');
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            await fetchPlaylists();
        }
    };

    const handleToggleStatus = (playlist: Playlist) => {
        setPlaylistToToggle(playlist);
        setShowToggleModal(true);
    };

    const handleDeletePlaylist = async () => {
        if (!playlistToDelete) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/playlists/${playlistToDelete}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setPlaylists(playlists.filter(p => p.id !== playlistToDelete));
                setShowDeleteModal(false);
                setPlaylistToDelete(null);
            } else {
                console.error('Failed to delete playlist');
            }
        } catch (error) {
            console.error('Error deleting playlist:', error);
        }
    };

    const openDeleteModal = (id: string) => {
        setPlaylistToDelete(id);
        setShowDeleteModal(true);
    };

    // --- Pagination Logic ---
    const filteredPlaylists = playlists.filter(playlist => {
        const matchesSearch = 
            playlist.countryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            playlist.url.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = 
            statusFilter === 'all' || 
            (statusFilter === 'active' && playlist.isActive) || 
            (statusFilter === 'inactive' && !playlist.isActive);

        return matchesSearch && matchesStatus;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPlaylists.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPlaylists.length / itemsPerPage);

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
                {/* Left: Filters */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700/50 shadow-lg">
                    <button
                        onClick={() => {
                            setStatusFilter('all');
                            setCurrentPage(1);
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                            statusFilter === 'all'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        Tous
                    </button>
                    <button
                        onClick={() => {
                            setStatusFilter('active');
                            setCurrentPage(1);
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                            statusFilter === 'active'
                            ? 'bg-green-500/20 text-green-400 shadow-sm'
                            : 'text-slate-400 hover:text-green-400'
                        }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'active' ? 'bg-green-400' : 'bg-slate-500'}`} />
                        Actifs
                    </button>
                    <button
                        onClick={() => {
                            setStatusFilter('inactive');
                            setCurrentPage(1);
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                            statusFilter === 'inactive'
                            ? 'bg-red-500/20 text-red-400 shadow-sm'
                            : 'text-slate-400 hover:text-red-400'
                        }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'inactive' ? 'bg-red-400' : 'bg-slate-500'}`} />
                        Inactifs
                    </button>
                </div>

                {/* Center: Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Rechercher un pays ou une URL..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500 shadow-lg"
                    />
                </div>

                {/* Right: Add Playlist Button */}
                <button
                    onClick={() => setShowPlaylistModal(true)}
                    className="px-4 py-2 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105 font-medium text-sm whitespace-nowrap"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter une playlist
                </button>
            </div>

            {/* Table Card */}
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-xl">
                {/* Table Header */}
                <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-400" />
                        Playlists Disponibles
                    </h3>
                    <button
                        onClick={fetchPlaylists}
                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Actualiser"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-700">
                            <tr>
                                <th className="p-4 font-semibold uppercase tracking-wider text-xs w-1/4">Pays</th>
                                <th className="p-4 font-semibold uppercase tracking-wider text-xs w-1/3">URL</th>
                                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Statut</th>
                                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Date d'ajout</th>
                                <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {playlists.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">
                                        Aucune playlist trouvée. Commencez par en ajouter une.
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((playlist) => (
                                    <tr key={playlist.id} className="hover:bg-slate-800/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-6 bg-slate-700 rounded shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                                                    <img
                                                        src={getCountryFlagUrl(playlist.countryCode)}
                                                        alt={playlist.countryName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <span className="font-medium text-white">{playlist.countryName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 max-w-xs">
                                                <div className="p-1.5 rounded bg-slate-800 text-violet-400 shrink-0">
                                                    <LinkIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="truncate text-slate-300 font-mono text-xs select-all" title={playlist.url}>
                                                    {playlist.url}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${playlist.isActive
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${playlist.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                                {playlist.isActive ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-400 text-xs">
                                            {new Date(playlist.createdAt).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="p-4 text-right relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuId(activeMenuId === playlist.id ? null : playlist.id);
                                                }}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    activeMenuId === playlist.id 
                                                    ? 'bg-slate-800 text-white' 
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                }`}
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>

                                            {activeMenuId === playlist.id && (
                                                <div 
                                                    ref={menuRef}
                                                    className="absolute right-12 top-2 z-50 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                                >
                                                    <div className="p-1 space-y-1">
                                                        <button
                                                            onClick={() => {
                                                                setPlaylistToEdit(playlist);
                                                                setShowPlaylistModal(true);
                                                                setActiveMenuId(null);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                handleToggleStatus(playlist);
                                                                setActiveMenuId(null);
                                                            }}
                                                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                                                playlist.isActive 
                                                                ? 'text-amber-400 hover:bg-amber-500/10' 
                                                                : 'text-green-400 hover:bg-green-500/10'
                                                            }`}
                                                        >
                                                            {playlist.isActive ? (
                                                                <>
                                                                    <Ban className="w-4 h-4" />
                                                                    Désactiver
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Power className="w-4 h-4" />
                                                                    Activer
                                                                </>
                                                            )}
                                                        </button>
                                                        <div className="h-px bg-slate-700/50 my-1" />
                                                        <button
                                                            onClick={() => {
                                                                openDeleteModal(playlist.id);
                                                                setActiveMenuId(null);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                            Page {currentPage} sur {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Playlist Modal */}
            {showPlaylistModal && (
                <PlaylistModal
                    onClose={() => {
                        setShowPlaylistModal(false);
                        setPlaylistToEdit(null);
                    }}
                    onSave={playlistToEdit ? handleEditPlaylist : handleAddPlaylist}
                    initialData={playlistToEdit}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && playlistToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Supprimer la playlist ?</h3>
                            <p className="text-slate-400 text-sm">
                                Cette action est irréversible. La playlist et ses chaînes associées seront retirées du catalogue.
                            </p>
                            <div className="flex gap-3 w-full pt-2">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleDeletePlaylist}
                                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Status Confirmation Modal */}
            {showToggleModal && playlistToToggle && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                                playlistToToggle.isActive 
                                ? 'bg-amber-500/10 text-amber-500' 
                                : 'bg-green-500/10 text-green-500'
                            }`}>
                                {playlistToToggle.isActive ? <Ban className="h-6 w-6" /> : <Power className="h-6 w-6" />}
                            </div>
                            <h3 className="text-xl font-bold text-white">
                                {playlistToToggle.isActive ? 'Désactiver la playlist ?' : 'Activer la playlist ?'}
                            </h3>
                            <p className="text-slate-400 text-sm">
                                {playlistToToggle.isActive 
                                    ? 'Les utilisateurs ne pourront plus accéder aux chaînes de cette playlist.'
                                    : 'Les chaînes de cette playlist seront à nouveau visibles pour les utilisateurs.'}
                            </p>
                            <div className="flex gap-3 w-full pt-2">
                                <button
                                    onClick={() => setShowToggleModal(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmToggleStatus}
                                    className={`flex-1 py-2.5 rounded-xl font-medium text-white transition-colors shadow-lg ${
                                        playlistToToggle.isActive 
                                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20' 
                                        : 'bg-green-600 hover:bg-green-700 shadow-green-900/20'
                                    }`}
                                >
                                    {playlistToToggle.isActive ? 'Désactiver' : 'Activer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Playlist Modal Component ---
interface PlaylistModalProps {
    onClose: () => void;
    onSave: (countryName: string, url: string, countryCode: string) => void;
    initialData?: Playlist | null;
}

const PlaylistModal: React.FC<PlaylistModalProps> = ({ onClose, onSave, initialData }) => {
    const [countryCode, setCountryCode] = useState(initialData?.countryCode || '');
    const [url, setUrl] = useState(initialData?.url || '');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const country = countries.find(c => c.code === countryCode);
        if (country && url) {
            onSave(country.name, url, countryCode);
        }
    };

    const selectedCountry = countries.find(c => c.code === countryCode);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowCountryDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl relative">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {initialData ? <Edit className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-blue-500" />}
                            {initialData ? 'Modifier la Playlist' : 'Nouvelle Playlist'}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            {initialData ? 'Modifiez les informations de la playlist.' : 'Ajoutez une source de chaînes TV via un flux M3U.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Country Select */}
                    <div className="space-y-2 relative" ref={dropdownRef}>
                        <label className="text-sm font-medium text-slate-300">Pays de la Playlist</label>
                        <p className="text-xs text-slate-500">
                            Sélectionnez le pays principal auquel appartiennent ces chaînes TV.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white hover:border-slate-600 transition-colors outline-none focus:ring-2 focus:ring-violet-500/50"
                        >
                            {selectedCountry ? (
                                <div className="flex items-center gap-3">
                                    <img src={getCountryFlagUrl(selectedCountry.code)} alt="" className="w-8 h-6 object-cover rounded shadow-sm" />
                                    <span className="font-medium">{selectedCountry.name}</span>
                                </div>
                            ) : (
                                <span className="text-slate-500">Sélectionner un pays...</span>
                            )}
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                        </button>

                        {showCountryDropdown && (
                            <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-custom">
                                <div className="p-2 space-y-1">
                                    {countries.map(country => (
                                        <button
                                            key={country.code}
                                            type="button"
                                            onClick={() => {
                                                setCountryCode(country.code);
                                                setShowCountryDropdown(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${countryCode === country.code
                                                ? 'bg-blue-500/10 text-blue-300'
                                                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <img src={getCountryFlagUrl(country.code)} alt="" className="w-8 h-6 object-cover rounded shadow-sm" />
                                                <span className="font-medium">{country.name}</span>
                                            </div>
                                            {countryCode === country.code && <Check className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* URL Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">URL du Flux M3U</label>
                        <p className="text-xs text-slate-500">
                            Lien direct vers le fichier .m3u ou le flux streaming.
                        </p>
                        <div className="relative">
                            <LinkIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="http://example.com/playlist.m3u"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={!url || !countryCode}
                            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {initialData ? 'Enregistrer' : 'Ajouter'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Channels;
