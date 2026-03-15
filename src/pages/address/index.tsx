import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { list_addresses } from '../../api'
import './index.scss'

export default function Address() {
    const [addresses, setAddresses] = useState<any[]>([])
    const currentInstance = Taro.getCurrentInstance()
    const router = currentInstance.router

    // 选择地址的来源路由标志
    const from = router && router.params ? router.params.from : undefined

    useLoad(() => {
        Taro.setNavigationBarTitle({ title: '收货地址' })
    })

    useEffect(() => {
        fetchAddresses()
    }, [])

    const fetchAddresses = async () => {
        try {
            const res = await list_addresses()
            if (res) {
                setAddresses(res)
            }
        } catch (e: any) {
            Taro.showToast({ title: e.message || '获取地址失败', icon: 'none' })
        }
    }

    const handleSelect = (address: any) => {
        if (from === 'checkout') {
            Taro.setStorageSync('selectedAddress', address)
            Taro.navigateBack()
        }
    }

    const goAddAddress = () => {
        Taro.navigateTo({ url: '/pages/address-edit/index' })
    }

    return (
        <View className="address-page">
            <ScrollView className="address-list" scrollY>
                {addresses.map((item: any) => (
                    <View key={item.id} className="address-item" onClick={() => handleSelect(item)}>
                        <View className="info">
                            <View className="user-info">
                                <Text className="name">{item.contact_name}</Text>
                                <Text className="phone">{item.phone}</Text>
                            </View>
                            <View className="detail">{item.address} {item.detail}</View>
                        </View>
                        <View className="edit-icon" onClick={(e) => {
                            e.stopPropagation()
                            Taro.navigateTo({ url: `/pages/address-edit/index?id=${item.id}` })
                        }}>✏️</View>
                    </View>
                ))}
            </ScrollView>

            <View className="bottom-btn">
                <Button className="add-btn" onClick={goAddAddress}>新增收货地址</Button>
            </View>
        </View>
    )
}
