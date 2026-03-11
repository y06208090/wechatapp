import React, { createContext, useContext, useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { current_store } from '../api'

export interface StoreInfo {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    phone: string;
    business_hours: string;
    status: string;
}

interface StoreContextType {
    currentStore: StoreInfo | null;
    setStore: (store: StoreInfo) => void;
    refreshStore: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentStore, setCurrentStoreState] = useState<StoreInfo | null>(null)

    // 初始化时从本地存储读取
    useEffect(() => {
        const savedStore = Taro.getStorageSync('currentStore')
        if (savedStore) {
            setCurrentStoreState(savedStore)
        } else {
            // 尝试从远端拉取
            refreshStore();
        }
    }, [])

    const setStore = (store: StoreInfo) => {
        setCurrentStoreState(store)
        Taro.setStorageSync('currentStore', store)
    }

    const refreshStore = async () => {
        try {
            const token = Taro.getStorageSync('token');
            if (token) {
                const storeRes = await current_store();
                if (storeRes) {
                    setStore(storeRes);
                }
            }
        } catch (e) {
            console.error('Failed to fetch current store', e)
        }
    }

    return (
        <StoreContext.Provider value={{ currentStore, setStore, refreshStore }}>
            {children}
        </StoreContext.Provider>
    )
}

export const useStore = () => {
    const context = useContext(StoreContext)
    if (!context) {
        throw new Error('useStore 必须在 StoreProvider 内使用')
    }
    return context
}
