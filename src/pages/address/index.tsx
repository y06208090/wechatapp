import React from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import './index.scss'

export default function Address() {
    const addresses = [
        { id: 1, name: '小象士兵', phone: '138****8888', address: '南区3栋201宿舍', isDefault: true },
        { id: 2, name: '小象士兵', phone: '138****8888', address: '实验楼B区3楼302', isDefault: false }
    ]

    return (
        <View className="address-page">
            <ScrollView className="address-list" scrollY>
                {addresses.map(item => (
                    <View key={item.id} className="address-item">
                        <View className="info">
                            <View className="user-info">
                                <Text className="name">{item.name}</Text>
                                <Text className="phone">{item.phone}</Text>
                                {item.isDefault && <Text className="default-tag">默认</Text>}
                            </View>
                            <View className="detail">{item.address}</View>
                        </View>
                        <View className="edit-icon">✏️</View>
                    </View>
                ))}
            </ScrollView>

            <View className="bottom-btn">
                <Button className="add-btn">新增收货地址</Button>
            </View>
        </View>
    )
}
