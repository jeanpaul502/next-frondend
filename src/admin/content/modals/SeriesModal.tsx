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
    Star,
    Calendar,
    AlertTriangle,
    Tv,
    Plus,
    Layers,
    PlayCircle,
    MoreVertical,
    Trash2,
    Edit3
} from 'lucide-react';

interface SeriesModalProps {
    onClose: () => void;
    onBack: () => void;
}

const SeriesModal: React.FC<SeriesModalProps> = ({ onClose, onBack }) => {
    const [activeTab, setActiveTab] = useState<'DETAILS' | 'SEASONS'>('DETAILS');
    const [selectedSeason, setSelectedSeason] = useState(1);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden w-full transition-all duration-300 max-w-6xl h-[90vh] flex flex-col">

                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Nouvelle Série
                                <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-xs font-medium border border-violet-500/20">
                                    Multiplex
                                </span>
                            </h2>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
                        <button
                            onClick={() => setActiveTab('DETAILS')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'DETAILS' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <FileText className="w-4 h-4" /> Détails
                        </button>
                        <button
                            onClick={() => setActiveTab('SEASONS')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'SEASONS' ? 'bg-violet-600/20 text-violet-300 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Layers className="w-4 h-4" /> Saisons & Épisodes
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-hidden relative">
                    {activeTab === 'DETAILS' ? (
                        <div className="h-full overflow-y-auto p-8 pb-32">
                            {/* Reusing the Movie Form Structure but adapted for Series */}
                            <div className="space-y-8 max-w-5xl mx-auto">
                                <div className="grid grid-cols-12 gap-8">
                                    {/* Left Column: Visuals */}
                                    <div className="col-span-12 lg:col-span-7 space-y-6">
                                        <div className="flex flex-col sm:flex-row gap-4 h-48">
                                            {/* Poster */}
                                            <div className="w-32 shrink-0 space-y-2 h-full flex flex-col">
                                                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                                    <ImageIcon className="w-4 h-4" /> Affiche
                                                </label>
                                                <div className="flex-1 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-violet-500/50 hover:bg-slate-800 transition-all cursor-pointer group relative overflow-hidden">
                                                    <Upload className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                                                </div>
                                            </div>
                                            {/* Backdrop */}
                                            <div className="flex-1 space-y-2 h-full flex flex-col">
                                                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                                    <ImageIcon className="w-4 h-4" /> Couverture
                                                </label>
                                                <div className="flex-1 w-full bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-violet-500/50 hover:bg-slate-800 transition-all cursor-pointer group relative overflow-hidden">
                                                    <Upload className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                                <FileText className="w-4 h-4" /> Synopsis de la Série
                                            </label>
                                            <textarea rows={5} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none resize-none" placeholder="Description globale..." />
                                        </div>
                                    </div>

                                    {/* Right Column: Metadata */}
                                    <div className="col-span-12 lg:col-span-5 space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                                <Tv className="w-4 h-4" /> Titre de la Série
                                            </label>
                                            <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-violet-500/50 outline-none" placeholder="Titre..." />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-300">Année Début</label>
                                                <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-violet-500/50 outline-none" placeholder="2020" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-300">Statut</label>
                                                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-violet-500/50 outline-none appearance-none cursor-pointer">
                                                    <option>En cours</option>
                                                    <option>Terminée</option>
                                                    <option>Annulée</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                                <Hash className="w-4 h-4" /> Genres
                                            </label>
                                            <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-violet-500/50 outline-none" placeholder="Drama, Action..." />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex">
                            {/* Sidebar: Seasons List */}
                            <div className="w-64 border-r border-slate-800 bg-slate-900/30 flex flex-col">
                                <div className="p-4 border-b border-slate-800">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Saisons</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {[1, 2, 3].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setSelectedSeason(s)}
                                            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${selectedSeason === s
                                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20'
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                                }`}
                                        >
                                            <span className="font-medium">Saison {s}</span>
                                            {selectedSeason === s && <ChevronLeft className="w-4 h-4 rotate-180" />}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-slate-800">
                                    <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-violet-500 hover:bg-violet-500/10 transition-all text-sm font-medium">
                                        <Plus className="w-4 h-4" /> Nouvelle Saison
                                    </button>
                                </div>
                            </div>

                            {/* Main: Episodes List */}
                            <div className="flex-1 bg-slate-900/50 overflow-y-auto p-8">
                                <div className="max-w-4xl mx-auto space-y-6">
                                    {/* Season Header */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                                Saison {selectedSeason}
                                                <span className="text-sm font-normal text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                                    202{selectedSeason} • 8 Épisodes
                                                </span>
                                            </h3>
                                            <p className="text-slate-400 text-sm mt-1">Gérez les épisodes de cette saison.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Episodes Table */}
                                    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-700 bg-slate-900/50 text-slate-400">
                                                    <th className="p-4 w-16 text-center">#</th>
                                                    <th className="p-4">Titre</th>
                                                    <th className="p-4">Durée</th>
                                                    <th className="p-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {[1, 2, 3, 4].map((ep) => (
                                                    <tr key={ep} className="hover:bg-slate-700/30 transition-colors group">
                                                        <td className="p-4 text-center font-medium text-slate-500">{ep}</td>
                                                        <td className="p-4 font-medium text-white">
                                                            Episode {ep}: The Beginning
                                                        </td>
                                                        <td className="p-4 text-slate-400 flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5" /> 4{ep} min
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {/* Add Episode Button */}
                                        <button className="w-full py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-violet-400 hover:bg-violet-500/5 transition-colors border-t border-slate-700/50 font-medium">
                                            <Plus className="w-4 h-4" /> Ajouter un épisode
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors font-medium border border-slate-700"
                    >
                        Annuler
                    </button>
                    <button className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-900/20 transition-all transform hover:scale-[1.02]">
                        Sauvegarder la Série
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SeriesModal;
