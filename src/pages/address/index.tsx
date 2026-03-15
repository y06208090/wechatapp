import { useState } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useDidShow, useLoad } from '@tarojs/taro'
import { delete_address, list_addresses, set_default_address } from '../../api'
import { AddressRecord, normalizeAddresses } from '../../utils/address'
import './index.scss'

export default function Address() {
    const [addresses, setAddresses] = useState<AddressRecord[]>([])
    const currentInstance = Taro.getCurrentInstance()
    const router = currentInstance.router

    // 选择地址的来源路由标志
    const from = router && router.params ? router.params.from : undefined

    useLoad(() => {
        Taro.setNavigationBarTitle({ title: '收货地址' })
    })

    useDidShow(() => {
        void fetchAddresses()
    })

    const fetchAddresses = async () => {
        try {
            const res = await list_addresses()
            setAddresses(normalizeAddresses(res))
        } catch (e: any) {
            Taro.showToast({ title: e.message || '获取地址失败', icon: 'none' })
        }
    }

    const handleSelect = (address: AddressRecord) => {
        if (from === 'checkout') {
            Taro.setStorageSync('selectedAddress', address)
            Taro.navigateBack()
        }
    }

    const goAddAddress = () => {
        Taro.navigateTo({ url: '/pages/address-edit/index' })
    }

    const handleSetDefault = async (address: AddressRecord) => {
        if (address.isDefault) {
            return
        }
        try {
            await set_default_address(address.id)
            Taro.showToast({ title: '已设为默认地址', icon: 'success' })
            await fetchAddresses()
        } catch (e: any) {
            Taro.showToast({ title: e.message || '设置默认失败', icon: 'none' })
        }
    }

    const handleDelete = async (address: AddressRecord) => {
        const modal = await Taro.showModal({
            title: '删除地址',
            content: `确认删除“${address.detail}”吗？`,
        })
        if (!modal.confirm) {
            return
        }
        try {
            await delete_address(address.id)
            Taro.showToast({ title: '已删除', icon: 'success' })
            await fetchAddresses()
        } catch (e: any) {
            Taro.showToast({ title: e.message || '删除失败', icon: 'none' })
        }
    }

    return (
        <View className="address-page">
            <ScrollView className="address-list" scrollY>
                {addresses.length === 0 ? (
                    <View className="empty-state">
                        <Text className="empty-title">还没有收货地址</Text>
                        <Text className="empty-subtitle">新增一个地址后，结算时就可以直接选择了</Text>
                    </View>
                ) : addresses.map((item) => (
                    <View key={item.id} className="address-item" onClick={() => handleSelect(item)}>
                        <View className="info">
                            <View className="user-info">
                                <Text className="name">{item.name}</Text>
                                <Text className="phone">{item.phone}</Text>
                                {item.isDefault ? <Text className="default-tag">默认</Text> : null}
                            </View>
                            <View className="detail">{item.detail}</View>
                            <View className="actions">
                                {!item.isDefault ? (
                                    <Text
                                        className="action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            void handleSetDefault(item)
                                        }}
                                    >
                                        设为默认
                                    </Text>
                                ) : null}
                                <Text
                                    className="action-btn"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        Taro.navigateTo({ url: `/pages/address-edit/index?id=${item.id}` })
                                    }}
                                >
                                    编辑
                                </Text>
                                <Text
                                    className="action-btn action-btn--danger"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        void handleDelete(item)
                                    }}
                                >
                                    删除
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View className="bottom-btn">
                <Button className="add-btn" onClick={goAddAddress}>新增收货地址</Button>
            </View>
        </View>
    )
}
