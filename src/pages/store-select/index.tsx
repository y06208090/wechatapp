import React, { useMemo, useState } from 'react'
import { Input, Map, ScrollView, Text, View } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'

import { nearby_stores, select_store } from '../../api'
import { resolveUserLocation, useStore } from '../../store/StoreContext'

import './index.scss'

export default function StoreSelect() {
    const { currentStore, setStore } = useStore()
    const currentStoreId = currentStore ? currentStore.id : ''
    const [stores, setStores] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [keyword, setKeyword] = useState('')
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [focusedStoreId, setFocusedStoreId] = useState('')

    useLoad(() => {
        void fetchNearbyStores()
    })

    const fetchNearbyStores = async () => {
        setLoading(true)
        Taro.showLoading({ title: '加载中...' })
        try {
            const location = await resolveUserLocation()
            setUserLocation(location)
            const res = await nearby_stores({ lat: location.lat, lng: location.lng })
            if (res && Array.isArray(res)) {
                setStores(res)
                const firstStoreId = res.length > 0 && res[0] ? res[0].id : ''
                setFocusedStoreId(currentStoreId || firstStoreId || '')
            }
        } catch (e: any) {
            Taro.showToast({ title: e.message || '获取门店失败', icon: 'none' })
        } finally {
            setLoading(false)
            Taro.hideLoading()
        }
    }

    const handleSelect = async (store: any) => {
        try {
            Taro.showLoading({ title: '切换中...' })
            const token = Taro.getStorageSync('token')
            if (token) {
                const res = await select_store({ store_id: store.id })
                if (res) {
                    setStore(res)
                }
            } else {
                setStore(store)
            }
            Taro.showToast({ title: '门店已切换', icon: 'success' })
            setTimeout(() => {
                Taro.navigateBack({
                    fail: () => {
                        Taro.switchTab({ url: '/pages/category/index' })
                    },
                })
            }, 1000)
        } catch (e: any) {
            Taro.showToast({ title: e.message || '切换门店失败', icon: 'none' })
        } finally {
            Taro.hideLoading()
        }
    }

    const filteredStores = useMemo(() => {
        const trimmedKeyword = keyword.trim().toLowerCase()
        if (!trimmedKeyword) {
            return stores
        }

        return stores.filter((store) =>
            [store.name, store.address]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(trimmedKeyword)),
        )
    }, [keyword, stores])

    const focusedStore = useMemo(
        () => filteredStores.find((store) => store.id === focusedStoreId)
            || stores.find((store) => store.id === focusedStoreId)
            || filteredStores[0]
            || stores[0]
            || null,
        [filteredStores, focusedStoreId, stores],
    )

    const mapLatitude = (focusedStore && focusedStore.lat) || (userLocation && userLocation.lat) || 29.07812
    const mapLongitude = (focusedStore && focusedStore.lng) || (userLocation && userLocation.lng) || 119.64759

    return (
        <View className='store-select'>
            <View className='hero'>
                <Map
                    className='store-map'
                    latitude={mapLatitude}
                    longitude={mapLongitude}
                    scale={15}
                    showLocation
                />
                <View className='hero-overlay'>
                    <View className='hero-header'>
                        <Text className='hero-title'>更多门店</Text>
                        <Text className='hero-subtitle'>地图浏览附近门店，支持名称和地址搜索</Text>
                    </View>
                    <View className='hero-search'>
                        <Text className='hero-search__city'>金华</Text>
                        <Input
                            className='hero-search__input'
                            placeholder='输入门店名称或地址搜索'
                            value={keyword}
                            onInput={(e) => setKeyword(e.detail.value)}
                        />
                    </View>
                    {focusedStore ? (
                        <View className='hero-focus-card'>
                            <View className='hero-focus-card__main'>
                                <Text className='hero-focus-card__name'>{focusedStore.name}</Text>
                                <Text className='hero-focus-card__meta'>
                                    距您{focusedStore.distance_km !== undefined && focusedStore.distance_km !== null ? focusedStore.distance_km.toFixed(2) : '0.00'}km
                                </Text>
                            </View>
                            <Text className='hero-focus-card__action'>查看</Text>
                        </View>
                    ) : null}
                </View>
            </View>

            <View className='list-panel'>
                <View className='list-panel__header'>
                    <Text className='list-panel__title'>附近</Text>
                    <Text className='list-panel__count'>{filteredStores.length} 家门店</Text>
                </View>

                <ScrollView scrollY className='store-list'>
                    {filteredStores.map((store) => (
                        <View
                            key={store.id}
                            className={`store-item ${currentStoreId === store.id ? 'active' : ''} ${!store.deliverable ? 'disabled' : ''}`}
                            onClick={() => setFocusedStoreId(store.id)}
                        >
                            <View className='info'>
                                <View className='headline'>
                                    <Text className='name'>{store.name}</Text>
                                    {currentStoreId === store.id ? (
                                        <View className='status'>当前选择</View>
                                    ) : null}
                                </View>
                                <Text className='distance'>
                                    距您{store.distance_km !== undefined && store.distance_km !== null ? store.distance_km.toFixed(2) : '0.00'}km
                                    <Text className='divider'> | </Text>
                                    {store.address}
                                </Text>
                                <View className='meta-row'>
                                    <Text className='hours'>{store.business_hours}</Text>
                                    <Text className={`tag ${store.deliverable ? 'deliverable' : 'un-deliverable'}`}>
                                        {store.deliverable ? '可配送' : '超出范围'}
                                    </Text>
                                </View>
                            </View>
                            <View
                                className={`select-btn ${currentStoreId === store.id ? 'selected' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (store.deliverable) {
                                        void handleSelect(store)
                                    }
                                }}
                            >
                                {currentStoreId === store.id ? '已选' : '选择'}
                            </View>
                        </View>
                    ))}
                    {!loading && filteredStores.length === 0 && (
                        <View className='empty'>没有搜到匹配门店</View>
                    )}
                </ScrollView>
            </View>
        </View>
    )
}
