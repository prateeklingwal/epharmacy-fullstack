import React, { createContext, useContext, useState, useCallback } from 'react';
import { getCart as fetchCart, addToCart as apiAddToCart, removeFromCart as apiRemove, clearCart as apiClear } from '../api';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total: '0.00' });
  const [loading, setLoading] = useState(false);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await fetchCart();
      setCart(data.data);
    } catch { /* not logged in */ }
    finally { setLoading(false); }
  }, []);

  const addItem = useCallback(async (medicine_id, quantity = 1) => {
    try {
      await apiAddToCart({ medicine_id, quantity });
      toast.success('Added to cart');
      await loadCart();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add');
    }
  }, [loadCart]);

  const removeItem = useCallback(async (medicine_id) => {
    try {
      await apiRemove(medicine_id);
      toast.success('Removed from cart');
      await loadCart();
    } catch { toast.error('Failed to remove'); }
  }, [loadCart]);

  const clearItems = useCallback(async () => {
    try {
      await apiClear();
      setCart({ items: [], total: '0.00' });
    } catch { /* ignore */ }
  }, []);

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, loading, loadCart, addItem, removeItem, clearItems, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
