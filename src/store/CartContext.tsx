import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { add_item, clear_cart, get_product } from '../api';
import { useStore } from './StoreContext';

export interface CartItem {
  id: string;
  cartItemId?: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  selected: boolean;
  available?: boolean;
  stock?: number;
  status?: string;
  invalidReason?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: any) => Promise<boolean>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  toggleSelect: (productId: string) => void;
  toggleSelectAll: () => void;
  clearCart: () => Promise<void>;
  syncCart: () => Promise<CartItem[]>;
  totalPrice: number;
  totalQuantity: number;
  isAllSelected: boolean;
  syncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const normalizeCartItem = (item: Partial<CartItem> & Pick<CartItem, 'id' | 'name' | 'price' | 'imageUrl' | 'quantity'>): CartItem => ({
  id: item.id,
  cartItemId: item.cartItemId,
  name: item.name,
  price: item.price,
  imageUrl: item.imageUrl,
  quantity: item.quantity,
  selected: item.selected !== false,
  available: item.available !== false,
  stock: item.stock,
  status: item.status,
  invalidReason: item.invalidReason,
})

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydratedStorageKey, setHydratedStorageKey] = useState('');
  const [syncing, setSyncing] = useState(false);
  const { currentStore } = useStore();
  const token = Taro.getStorageSync('token');
  const currentStoreId = currentStore ? currentStore.id : '';
  const cartStorageKey = token && currentStoreId ? `cart:${token}:${currentStoreId}` : '';

  useEffect(() => {
    if (!cartStorageKey) {
      setItems([]);
      setHydratedStorageKey('');
      return;
    }

    const cached = Taro.getStorageSync(cartStorageKey);
    if (Array.isArray(cached)) {
      setItems(cached.map((item) => normalizeCartItem(item)));
    } else {
      setItems([]);
    }
    setHydratedStorageKey(cartStorageKey);
  }, [cartStorageKey])

  useEffect(() => {
    if (!cartStorageKey || hydratedStorageKey !== cartStorageKey) {
      return;
    }
    Taro.setStorageSync(cartStorageKey, items);
  }, [items, cartStorageKey, hydratedStorageKey])

  const syncCart = async (): Promise<CartItem[]> => {
    if (!token || !currentStoreId || !cartStorageKey || syncing) {
      return items;
    }

    setSyncing(true)
    try {
      const syncedItems = await Promise.all(
        items.map(async (item) => {
          try {
            const latest = await get_product(item.id, { store_id: currentStoreId })
            const available = latest && latest.status === 'ON' && Number(latest.stock || 0) > 0
            return normalizeCartItem({
              ...item,
              name: latest && latest.title ? latest.title : item.name,
              price: latest && latest.price !== undefined && latest.price !== null ? latest.price : item.price,
              imageUrl: latest && latest.cover_image ? latest.cover_image : item.imageUrl,
              available,
              stock: latest && latest.stock !== undefined && latest.stock !== null ? latest.stock : item.stock,
              status: latest && latest.status ? latest.status : item.status,
              selected: available ? item.selected : false,
              invalidReason: available ? '' : '商品已下架或售罄',
            })
          } catch (error) {
            console.error('[cart] sync product failed', item.id, error)
            return normalizeCartItem({
              ...item,
              available: false,
              selected: false,
              invalidReason: '商品已下架或不可购买',
            })
          }
        })
      )

      setItems(syncedItems)

      await clear_cart({ store_id: currentStoreId })
      const syncableItems = syncedItems.filter((item) => item.available !== false && item.quantity > 0)
      await Promise.all(
        syncableItems.map((item) =>
          add_item({
            store_id: currentStoreId,
            product_id: item.id,
            qty: item.quantity,
            price_snapshot: item.price !== undefined && item.price !== null ? item.price : 0,
          })
        )
      )

      if (syncedItems.some((item) => item.available === false)) {
        Taro.showToast({ title: '部分商品已下架，已置灰', icon: 'none' })
      }
      return syncedItems
    } catch (error) {
      console.error('[cart] sync failed', error)
      Taro.showToast({ title: '购物车同步失败', icon: 'none' })
      return items
    } finally {
      setSyncing(false)
    }
  }

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
      setItems((prev) => {
        const existing = prev.find((item) => item.id === product.id)
        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? normalizeCartItem({
                ...item,
                quantity: item.quantity + 1,
                price: product.price !== undefined && product.price !== null ? product.price : item.price,
                imageUrl: product.imageUrl || item.imageUrl,
                name: product.name || item.name,
                available: true,
                invalidReason: '',
              })
              : item
          )
        }

        return prev.concat(
          normalizeCartItem({
            id: product.id,
            name: product.name || '商品',
            price: product.price !== undefined && product.price !== null ? product.price : 0,
            imageUrl: product.imageUrl || '',
            quantity: 1,
            selected: true,
            available: true,
            invalidReason: '',
          })
        )
      })
      return true
    } catch (e: any) {
      Taro.showToast({ title: e.message || '加入失败', icon: 'none' })
      return false
    }
  };

  const removeItem = async (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!currentStoreId) return;
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? normalizeCartItem({
            ...item,
            quantity,
          })
          : item
      )
    );
  };

  const toggleSelect = (productId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? normalizeCartItem({
            ...item,
            selected: item.available === false ? false : !item.selected,
          })
          : item
      )
    );
  };

  const toggleSelectAll = () => {
    const selectableItems = items.filter((item) => item.available !== false)
    const allSelected = selectableItems.length > 0 && selectableItems.every((item) => item.selected)
    setItems((prev) =>
      prev.map((item) =>
        normalizeCartItem({
          ...item,
          selected: item.available === false ? false : !allSelected,
        })
      )
    );
  };

  const clearCart = async () => {
    setItems([])
  };

  const totalPrice = useMemo(() => {
    return items
      .filter((item) => item.selected && item.available !== false)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const isAllSelected = useMemo(() => {
    const selectableItems = items.filter((item) => item.available !== false)
    return selectableItems.length > 0 && selectableItems.every((item) => item.selected);
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
        syncCart,
        totalPrice,
        totalQuantity,
        isAllSelected,
        syncing,
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
