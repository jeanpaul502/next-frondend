import React from 'react';
import { UINotification } from '../../hooks/useNotifications';

interface NotificationsPanelProps {
    isOpen: boolean;
    notifications: UINotification[];
    onClose: () => void;
    onMarkAllAsRead: () => void;
    onDelete: (id: string) => void;
    onMarkAsRead: (id: string) => void;
    onNotificationClick: (notification: UINotification) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
    isOpen,
    notifications,
    onClose,
    onMarkAllAsRead,
    onDelete,
    onMarkAsRead,
    onNotificationClick,
    containerRef
}) => {
    if (!isOpen) return null;

    return (
        <div
            ref={containerRef}
            className="absolute top-full right-0 mt-4 w-80 sm:w-96 bg-black/100 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200 cursor-default z-50"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-white font-semibold">Notifications</h3>
                {notifications.length > 0 && (
                    <div className="flex gap-6">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onMarkAllAsRead();
                            }}
                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 7 17l-5-5" />
                                <path d="m22 10-7.5 7.5L13 16" />
                            </svg>
                            Tout lu
                        </button>
                    </div>
                )}
            </div>

            <div className="max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-600">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-4">
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" className="text-gray-500">
                                <g fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M18.75 9.71v-.705C18.75 5.136 15.726 2 12 2S5.25 5.136 5.25 9.005v.705a4.4 4.4 0 0 1-.692 2.375L3.45 13.81c-1.011 1.575-.239 3.716 1.52 4.214a25.8 25.8 0 0 0 14.06 0c1.759-.498 2.531-2.639 1.52-4.213l-1.108-1.725a4.4 4.4 0 0 1-.693-2.375Z" />
                                    <path strokeLinecap="round" d="M7.5 19c.655 1.748 2.422 3 4.5 3s3.845-1.252 4.5-3" />
                                </g>
                            </svg>
                        </div>
                        <p className="text-sm font-medium">Aucune notification</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {notifications.map((notification) => (
                            <div 
                                key={notification.id} 
                                className={`relative flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group/item cursor-pointer ${!notification.read ? 'bg-white/[0.02]' : ''}`}
                                onClick={() => {
                                    onMarkAsRead(notification.id);
                                    onNotificationClick(notification);
                                }}
                            >
                                {/* Movie Poster */}
                                <img
                                    src={notification.image}
                                    alt={notification.title}
                                    className="w-16 h-24 rounded-lg object-cover shadow-lg flex-shrink-0"
                                />

                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                    {/* Title Row + Delete Button */}
                                    <div className="flex items-center justify-between w-full gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <h4 className={`font-medium text-sm truncate ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                                                {notification.title}
                                            </h4>
                                            {!notification.read && (
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                                            )}
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(notification.id);
                                            }}
                                            className="text-gray-500 hover:text-red-500 transition-colors p-1.5 opacity-0 group-hover/item:opacity-100 focus:opacity-100 flex-shrink-0"
                                            title="Supprimer"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Message + Status Row */}
                                    <div className="flex items-center gap-2">
                                        <p className="text-gray-400 text-xs line-clamp-1">{notification.message}</p>
                                        {notification.status && (
                                            <span className={`text-[10px] font-bold ${notification.statusColor} flex-shrink-0`}>
                                                {notification.status}
                                            </span>
                                        )}
                                    </div>

                                    {/* Time Row */}
                                    <p className="text-gray-600 text-[10px]">{notification.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
