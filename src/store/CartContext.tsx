import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { get_cart, add_item, update_qty, remove_item, clear_cart } from '../api';
import { useStore } from './StoreContext';

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
  addItem: (product: any) => Promise<boolean>;
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
  const { currentStore } = useStore();
  const token = Taro.getStorageSync('token');
  const currentStoreId = currentStore ? currentStore.id : '';

  const fetchCart = async () => {
    if (!token || !currentStoreId) {
      setItems([]);
      return;
    }
    try {
      const res = await get_cart({ store_id: currentStoreId });
      if (res && res.items) {
        const cartItems = res.items.map((it: any) => ({
          id: it.product_id,
          cartItemId: it.id,
          name: (it.product && (it.product.title || it.product.name)) || '商品',
          price: it.product && it.product.price !== undefined && it.product.price !== null
            ? it.product.price
            : (it.price_snapshot !== undefined && it.price_snapshot !== null ? it.price_snapshot : 0),
          imageUrl: (it.product && (it.product.cover_image || it.product.imageUrl)) || '',
          quantity: it.quantity !== undefined && it.quantity !== null
            ? it.quantity
            : (it.qty !== undefined && it.qty !== null ? it.qty : 0),
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
  }, [token, currentStoreId])

  const addItem = async (product: any) => {
    if (!token) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return false;
    }
    if (!currentStoreId) {
      Taro.showToast({ title: '请先选择门店', icon: 'none' })
      Taro.navigateTo({ url: '/pages/store-select/index' })
      return false;
    }
    try {
      Taro.showLoading({ title: '添加中...' })
      await add_item({
        store_id: currentStoreId,
        product_id: product.id,
        qty: 1,
        price_snapshot: product.price !== undefined && product.price !== null ? product.price : 0,
      })
      await fetchCart()
      return true
    } catch (e: any) {
      Taro.showToast({ title: e.message || '加入失败', icon: 'none' })
      return false
    } finally {
      Taro.hideLoading()
    }
  };

  const removeItem = async (productId: string) => {
    if (!token || !currentStoreId) return;
    const item = items.find(i => i.id === productId);
    if (item) {
      try {
        await remove_item({
          store_id: currentStoreId,
          product_id: productId,
        })
        await fetchCart()
      } catch (e) {
        console.error('remove failed')
      }
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!currentStoreId) return;
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
    const item = items.find(i => i.id === productId);
    if (item) {
      try {
        await update_qty({
          store_id: currentStoreId,
          product_id: productId,
          qty: quantity,
        })
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
    if (!token || !currentStoreId) return;
    try {
      await clear_cart({ store_id: currentStoreId })
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

  useEffect(() => {
    if (totalQuantity > 0) {
      Taro.setTabBarBadge({
        index: 1,
        text: totalQuantity > 99 ? '99+' : String(totalQuantity),
      }).catch(() => {})
      return
    }

    Taro.removeTabBarBadge({ index: 1 }).catch(() => {})
  }, [totalQuantity])

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
