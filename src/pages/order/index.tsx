import { useState } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'

import { list_orders } from '../../api'

import './index.scss'

const tabs = ['全部', '待付款', '待接单', '进行中', '已完成']

const statusMap: Record<number, string> = {
    0: '',
    1: 'PENDING_PAY',
    2: 'PENDING_ACCEPT',
    3: 'IN_PROGRESS',
    4: 'COMPLETED',
}

const statusTextMap: Record<string, string> = {
    PENDING_PAY: '待支付',
    PENDING_ACCEPT: '待接单',
    ACCEPTED: '备货中',
    DELIVERING: '配送中',
    WAITING_PICKUP: '待提货',
    COMPLETED: '已完成',
    CANCELED: '已取消',
    CLOSED: '已关闭',
}

export default function Order() {
    const [activeTab, setActiveTab] = useState(0)
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useDidShow(() => {
        void fetchOrders(activeTab)
    })

    const fetchOrders = async (tabIndex: number) => {
        setLoading(true)
        try {
            const status = statusMap[tabIndex]
            const res = await list_orders(status && status !== 'IN_PROGRESS' ? { status } : {})
            const list = Array.isArray(res) ? res : []
            setOrders(
                status === 'IN_PROGRESS'
                    ? list.filter((item: any) => ['ACCEPTED', 'DELIVERING', 'WAITING_PICKUP'].includes(item.status))
                    : list,
            )
        } catch (e) {
            console.error('fetch orders error', e)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const onTabClick = (idx: number) => {
        setActiveTab(idx)
        void fetchOrders(idx)
    }

    const goDetail = (id: string) => {
        Taro.navigateTo({ url: `/pages/order-detail/index?id=${id}` })
    }

    const formatDateTime = (value?: string) => {
        if (!value) {
            return '--'
        }
        return value.replace('T', ' ').slice(0, 16)
    }

    return (
        <View className="order-page">
            <ScrollView className="tabs" scrollX>
                {tabs.map((tab, idx) => (
                    <View
                        key={idx}
                        className={`tab-item ${activeTab === idx ? 'active' : ''}`}
                        onClick={() => onTabClick(idx)}
                    >
                        {tab}
                    </View>
                ))}
            </ScrollView>

            <ScrollView className="order-list" scrollY>
                {orders.length > 0 ? orders.map((order) => (
                    <View className="order-item" key={order.order_id} onClick={() => goDetail(order.order_id)}>
                        <View className="header-row">
                            <Text className="store-name">{(order.store_snapshot && order.store_snapshot.name) || '小象超市门店'}</Text>
                            <Text className="status">{statusTextMap[order.status] || order.status}</Text>
                        </View>

                        <View className="goods-summary">
                            <Text className="goods-title">
                                {(order.items || []).map((item: any) => item.title_snapshot).join(' / ')}
                            </Text>
                        </View>

                        <View className="footer-row">
                            <Text className="time">{formatDateTime(order.created_at)}</Text>
                            <View>
                                共 {(order.items && order.items.length) || 0} 件商品，实付：
                                <Text className="price">¥{((order.amount_payable || 0) / 100).toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                )) : (
                    <View className="empty-state">
                        <Image className="icon" src="" mode="aspectFit" />
                        <Text>{loading ? '加载中...' : '暂无相关订单记录'}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    )
}
