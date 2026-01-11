import { API_BASE_URL } from './config';
import { showSuccessToast } from '../lib/toast';

export interface MovieItem {
    id: string | number;
    title: string;
    image: string;
    rating: number;
    year: number;
    category: string;
    duration?: string;
    description?: string;
    backdropPath?: string;
    logoPath?: string;
    tmdbId?: number;
    addedAt?: Date;
    [key: string]: any;
}

const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    try {
        let response = await fetch(url, { ...options, credentials: 'include' });
        
        if (response.status === 401) {
            // Try to refresh token
            try {
                const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include'
                });
                
                if (refreshResponse.ok) {
                    // Retry original request
                    response = await fetch(url, { ...options, credentials: 'include' });
                }
            } catch (e) {
                // Token refresh failed
            }
        }
        return response;
    } catch (e) {
        throw e;
    }
};

export const getMyList = async (): Promise<MovieItem[]> => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/my-list`);
        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (e) {
        return [];
    }
};

export const addToMyList = async (movie: MovieItem) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/my-list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ movieId: movie.id })
        });
        
        if (response.ok) {
            window.dispatchEvent(new Event('my-list-updated'));
            showSuccessToast(movie.title, 'a été ajouté à votre liste.');
            return true;
        }
    } catch (e) {
        // Silent error
    }
    return false;
};

export const removeFromMyList = async (id: string | number) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/my-list/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            window.dispatchEvent(new Event('my-list-updated'));
            return true;
        }
    } catch (e) {
        // Silent error
    }
    return false;
};

export const isInMyList = async (id: string | number): Promise<boolean> => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/my-list/check/${id}`);
        if (response.ok) {
            const data = await response.json();
            return data.inList;
        }
    } catch (e) {
        // Silent error
    }
    return false;
};
