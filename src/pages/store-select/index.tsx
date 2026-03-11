import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useStore, StoreInfo } from '../../store/StoreContext'
import { nearby_stores, select_store } from '../../api'
import './index.scss'

export default function StoreSelect() {
    const { currentStore, setStore } = useStore()
    const [stores, setStores] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useLoad(() => {
        fetchNearbyStores()
    })

    const fetchNearbyStores = async () => {
        setLoading(true)
        Taro.showLoading({ title: '加载中...' })
        try {
            // 模拟获取用户经纬度，也可以调用 Taro.getLocation
            // 这里暂时使用默认坐标 或 尝试获取
            let lat = 39.9042;
            let lng = 116.4074;
            try {
                const loc = await Taro.getLocation({ type: 'gcj02' });
                lat = loc.latitude;
                lng = loc.longitude;
            } catch (err) {
                console.warn('获取定位失败，使用默认坐标', err)
            }

            const res = await nearby_stores({ params: { lat, lng } })
            if (res && Array.isArray(res)) {
                setStores(res)
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
            const res = await select_store({ data: { store_id: store.id } })
            if (res) {
                setStore(res)
                Taro.showToast({ title: '门店已切换', icon: 'success' })
                setTimeout(() => {
                    Taro.navigateBack({
                        fail: () => {
                            Taro.switchTab({ url: '/pages/category/index' })
                        }
                    })
                }, 1500)
            }
        } catch (e: any) {
            Taro.showToast({ title: e.message || '切换门店失败', icon: 'none' })
        } finally {
            Taro.hideLoading()
        }
    }

    return (
        <View className='store-select'>
            <View className='header'>
                <Text className='title'>请选择服务门店</Text>
            </View>

            <ScrollView scrollY className='store-list'>
                {stores.map(store => (
                    <View
                        key={store.id}
                        className={`store-item ${currentStore?.id === store.id ? 'active' : ''} ${!store.deliverable ? 'disabled' : ''}`}
                        onClick={() => store.deliverable && handleSelect(store)}
                    >
                        <View className='info'>
                            <Text className='name'>{store.name}</Text>
                            <Text className='address'>{store.address}</Text>
                            <View className='tags'>
                                {store.deliverable ? (
                                    <Text className='tag deliverable'>可配送 (距离 {store.distance_km?.toFixed(2)}km)</Text>
                                ) : (
                                    <Text className='tag un-deliverable'>超出配送范围</Text>
                                )}
                            </View>
                        </View>
                        {currentStore?.id === store.id && (
                            <View className='status'>当前门店</View>
                        )}
                    </View>
                ))}
                {!loading && stores.length === 0 && (
                    <View className='empty'>暂无可用门店</View>
                )}
            </ScrollView>
        </View>
    )
}
