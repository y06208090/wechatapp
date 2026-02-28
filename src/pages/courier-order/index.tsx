import React, { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import './index.scss'

export default function CourierOrder() {
    const [activeTab, setActiveTab] = useState(0)
    const tabs = ['全部', '待接单', '配送中', '已完成']

    const orders = [
        { id: '1001', sn: 'CDO20260228001', status: '配送中', company: '顺丰速运', address: '南区3栋201', time: '2026-02-28 16:30' },
        { id: '1002', sn: 'CDO20260228002', status: '已完成', company: '中通快递', address: '南区3栋201', time: '2026-02-27 10:15' }
    ]

    return (
        <View className="courier-order-page">
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

            <ScrollView className="order-list" scrollY>
                {orders.length > 0 ? orders.map(order => (
                    <View key={order.id} className="order-card">
                        <View className="header">
                            <Text className="sn">订单号: {order.sn}</Text>
                            <Text className={`status ${order.status === '配送中' ? 'active' : ''}`}>{order.status}</Text>
                        </View>
                        <View className="content">
                            <View className="info-row"><Text className="label">快递公司：</Text><Text>{order.company}</Text></View>
                            <View className="info-row"><Text className="label">送达地址：</Text><Text>{order.address}</Text></View>
                            <View className="info-row"><Text className="label">下单时间：</Text><Text>{order.time}</Text></View>
                        </View>
                        <View className="footer">
                            <View className="btn">查看轨迹</View>
                            {order.status === '已完成' && <View className="btn primary">再来一单</View>}
                        </View>
                    </View>
                )) : (
                    <View className="empty">暂无相关订单</View>
                )}
            </ScrollView>
        </View>
    )
}
