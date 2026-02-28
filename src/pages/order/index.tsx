import React, { useState } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import './index.scss'

export default function Order() {
    const [activeTab, setActiveTab] = useState(0)
    const tabs = ['全部', '待付款', '待发货', '待收货', '退款/售后']

    return (
        <View className="order-page">
            <ScrollView className="tabs" scrollX>
                {tabs.map((tab, idx) => (
                    <View
                        key={idx}
                        className={`tab-item ${activeTab === idx ? 'active' : ''}`}
                        onClick={() => setActiveTab(idx)}
                    >
                        {tab}
                    </View>
                ))}
            </ScrollView>

            <View className="empty-state">
                <Image className="icon" src="https://img12.360buyimg.com/img/s240x240_jfs/t1/181467/20/19052/15392/611a133fEbb8119eb/b2ab91fe9da248fd.png" mode="aspectFit" />
                <Text>暂无相关订单记录</Text>
            </View>
        </View>
    )
}
