import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../utils/config';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface Notification {
    id: string;
    title: string;
    message: string;
    movieId?: string;
    posterPath?: string;
    type: 'NEW_CONTENT' | 'SYSTEM' | 'INFO';
    createdAt: string;
    isRead: boolean;
}

export interface UINotification {
    id: string;
    title: string;
    image: string;
    message: string;
    time: string;
    read: boolean;
    group: string;
    status?: string;
    statusColor?: string;
    movieId?: string;
}

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<UINotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on how token is stored
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data: Notification[] = await response.json();
                
                // Map to UI format
                const mapped = data.map(n => {
                    const date = new Date(n.createdAt);
                    const now = new Date();
                    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                    
                    let group = "Aujourd'hui";
                    if (diffDays === 1) group = "Hier";
                    else if (diffDays > 1) group = "Plus tôt";

                    let status = '';
                    let statusColor = '';

                    if (n.type === 'NEW_CONTENT') {
                        status = 'Nouveau';
                        statusColor = 'text-green-400';
                    } else if (n.type === 'SYSTEM') {
                        status = 'Système';
                        statusColor = 'text-blue-400';
                    } else if (n.type === 'INFO') {
                        status = 'Info';
                        statusColor = 'text-gray-400';
                    }

                    return {
                        id: n.id,
                        title: n.title,
                        image: n.posterPath ? (n.posterPath.startsWith('http') ? n.posterPath : `https://image.tmdb.org/t/p/w500${n.posterPath}`) : 'https://via.placeholder.com/150',
                        message: n.message,
                        time: formatDistanceToNow(date, { addSuffix: true, locale: fr }),
                        read: n.isRead,
                        group,
                        status,
                        statusColor,
                        movieId: n.movieId
                    };
                });

                setNotifications(mapped);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        
        try {
            await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error marking as read', error);
        }
    };

    const markAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        
        // Loop for now as backend doesn't have bulk endpoint yet, or implement bulk on backend
        // For now, we just update UI. Real app should have bulk endpoint.
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        unreadIds.forEach(id => {
             fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                method: 'POST',
                credentials: 'include'
            }).catch(e => console.error(e));
        });
    };

    const deleteNotification = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id));

        try {
            await fetch(`${API_BASE_URL}/notifications/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error deleting notification', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Optional: Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return {
        notifications,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refetch: fetchNotifications
    };
};
