import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { get_cart, add_item, update_qty, remove_item, clear_cart } from '../api';

export interface CartItem {
  id: string;
  cartItemId?: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  selected: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: any) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  toggleSelect: (productId: string) => void;
  toggleSelectAll: () => void;
  clearCart: () => Promise<void>;
  totalPrice: number;
  totalQuantity: number;
  isAllSelected: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const token = Taro.getStorageSync('token');

  const fetchCart = async () => {
    if (!token) return;
    try {
      const res = await get_cart();
      if (res && res.items) {
        const cartItems = res.items.map((it: any) => ({
          id: it.product_id,
          cartItemId: it.id,
          name: it.product.title || it.product.name,
          price: it.product.price,
          imageUrl: it.product.cover_image || it.product.imageUrl,
          quantity: it.quantity,
          selected: true
        }))
        setItems(cartItems)
      }
    } catch (e) {
      console.error("Cart fetch error:", e)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [token])

  const addItem = async (product: any) => {
    if (!token) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return;
    }
    try {
      Taro.showLoading({ title: '添加中...' })
      await add_item({ data: { product_id: product.id, quantity: 1 } })
      await fetchCart()
    } catch (e: any) {
      Taro.showToast({ title: e.message || '加入失败', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  };

  const removeItem = async (productId: string) => {
    if (!token) return;
    const item = items.find(i => i.id === productId);
    if (item && item.cartItemId) {
      try {
        await remove_item({ data: { item_ids: [item.cartItemId] } })
        await fetchCart()
      } catch (e) {
        console.error('remove failed')
      }
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
    const item = items.find(i => i.id === productId);
    if (item && item.cartItemId) {
      try {
        await update_qty({ data: { item_id: item.cartItemId, quantity } })
      } catch (e) { }
    }
  };

  const toggleSelect = (productId: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = items.every((item) => item.selected);
    setItems((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
  };

  const clearCart = async () => {
    if (!token) return;
    try {
      await clear_cart()
      setItems([])
    } catch (e) { }
  };

  const totalPrice = useMemo(() => {
    return items
      .filter((item) => item.selected)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const isAllSelected = useMemo(() => {
    return items.length > 0 && items.every((item) => item.selected);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        toggleSelect,
        toggleSelectAll,
        clearCart,
        totalPrice,
        totalQuantity,
        isAllSelected,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
