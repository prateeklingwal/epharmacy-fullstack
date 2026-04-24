import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [retailer, setRetailer] = useState(() => {
    try { return JSON.parse(localStorage.getItem('retailer')); } catch { return null; }
  });

  const loginUser = useCallback((token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const loginRetailer = useCallback((token, retailerData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('retailer', JSON.stringify(retailerData));
    setRetailer(retailerData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('retailer');
    setUser(null);
    setRetailer(null);
    window.location.href = '/';
  }, []);

  return (
    <AuthContext.Provider value={{ user, retailer, loginUser, loginRetailer, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
