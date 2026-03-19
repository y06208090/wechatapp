import React, { createContext, useContext, useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { current_store, nearby_stores, select_store } from '../api'

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
    refreshStore: (allowLocationFallback?: boolean) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export const resolveUserLocation = async () => {
    const settings = await new Promise<WechatMiniprogram.GetSettingSuccessCallbackResult>((resolve, reject) => {
        Taro.getSetting({
            success: resolve,
            fail: reject,
        })
    })
    const hasPermission = settings.authSetting['scope.userLocation']

    if (!hasPermission) {
        try {
            await new Promise<void>((resolve, reject) => {
                Taro.authorize({
                    scope: 'scope.userLocation',
                    success: () => resolve(),
                    fail: reject,
                })
            })
        } catch (_error) {
            const modal = await Taro.showModal({
                title: '需要位置权限',
                content: '请先允许获取位置信息，用于为你匹配最近门店',
                confirmText: '去开启',
            })

            if (!modal.confirm) {
                throw new Error('未授予定位权限')
            }

            const openRes = await new Promise<WechatMiniprogram.OpenSettingSuccessCallbackResult>((resolve, reject) => {
                Taro.openSetting({
                    success: resolve,
                    fail: reject,
                })
            })
            if (!openRes.authSetting['scope.userLocation']) {
                throw new Error('未授予定位权限')
            }
        }
    }

    const location = await new Promise<WechatMiniprogram.GetLocationSuccessCallbackResult>((resolve, reject) => {
        Taro.getLocation({
            type: 'gcj02',
            success: resolve,
            fail: reject,
        })
    })
    return {
        lat: location.latitude,
        lng: location.longitude,
    }
}

export const fetchNearestStore = async (): Promise<StoreInfo | null> => {
    const { lat, lng } = await resolveUserLocation()
    const stores = await nearby_stores({ lat, lng })
    if (!Array.isArray(stores) || stores.length === 0) {
        return null
    }

    const deliverableStore = stores.find((item) => item.deliverable)
    return deliverableStore || stores[0]
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentStore, setCurrentStoreState] = useState<StoreInfo | null>(null)

    const setStore = (store: StoreInfo) => {
        setCurrentStoreState(store)
        Taro.setStorageSync('currentStore', store)
    }

    const refreshCurrentStore = async (allowLocationFallback: boolean = true) => {
        try {
            const token = Taro.getStorageSync('token')
            if (token) {
                try {
                    const storeRes = await current_store()
                    if (storeRes) {
                        setStore(storeRes)
                        return
                    }
                } catch (error) {
                    console.warn('Current store missing, fallback to nearest store', error)
                }
            }

            if (!allowLocationFallback) {
                return
            }

            const nearestStore = await fetchNearestStore()
            if (!nearestStore) {
                Taro.showToast({ title: '附近暂无可用门店', icon: 'none' })
                return
            }

            setStore(nearestStore)
            if (token) {
                try {
                    await select_store({ store_id: nearestStore.id })
                } catch (error) {
                    console.warn('Failed to sync nearest store to backend', error)
                }
            }
        } catch (e) {
            console.error('Failed to fetch current store', e)
        }
    }

    // 初始化时从本地存储读取
    useEffect(() => {
        const savedStore = Taro.getStorageSync('currentStore')
        if (savedStore) {
            setCurrentStoreState(savedStore)
        }
        void refreshCurrentStore(false)
    }, [])

    return (
        <StoreContext.Provider value={{ currentStore, setStore, refreshStore: refreshCurrentStore }}>
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
