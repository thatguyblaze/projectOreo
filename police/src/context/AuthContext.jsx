import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for persistent session
        try {
            const storedUser = localStorage.getItem('mpd_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user session", error);
            localStorage.removeItem('mpd_user');
        }
        setLoading(false);
    }, []);

    const login = (badge, password) => {
        // Mock Authentication Logic
        // In a real app, this would be an API call
        if (password === 'admin' || password === 'password') {
            const userData = {
                name: 'Ofc. John Doe',
                badge: badge,
                rank: 'Officer',
                role: 'admin',
                avatar: 'JD'
            };
            setUser(userData);
            localStorage.setItem('mpd_user', JSON.stringify(userData));
            return { success: true };
        } else {
            return { success: false, message: 'Invalid Credentials' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('mpd_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
