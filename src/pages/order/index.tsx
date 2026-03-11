import { useState } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { list_orders } from '../../api'
import './index.scss'

export default function Order() {
    const [activeTab, setActiveTab] = useState(0)
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const tabs = ['全部', '待付款', '待发货', '待收货', '退款/售后']

    const statusMap = {
        0: '', // 全部
        1: 'pending_payment',
        2: 'paid', // 待发货
        3: 'shipping', // 待收货
        4: 'refund' // 退款售后
    }

    useDidShow(() => {
        fetchOrders(activeTab)
    })

    const fetchOrders = async (tabIndex: number) => {
        setLoading(true)
        try {
            const status = statusMap[tabIndex]
            const params = status ? { status } : {}
            const res = await list_orders(params)

            if (res && res.items) {
                setOrders(res.items)
            } else {
                setOrders([])
            }
        } catch (e) {
            console.error('fetch orders error', e)
        } finally {
            setLoading(false)
        }
    }

    const onTabClick = (idx: number) => {
        setActiveTab(idx)
        fetchOrders(idx)
    }

    const goDetail = (id: string) => {
        Taro.navigateTo({ url: `/pages/order-detail/index?id=${id}` })
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
                {orders.length > 0 ? orders.map(order => (
                    <View className="order-item" key={order.id} onClick={() => goDetail(order.id)}>
                        <View className="header-row">
                            <Text className="store-name">{order.store?.name || '特卖店'}</Text>
                            <Text className="status">{order.status}</Text>
                        </View>

                        <ScrollView className="goods-imgs" scrollX>
                            {order.items && order.items.map((item: any, i: number) => (
                                <Image key={i} className="img" src={item.product?.cover_image} mode="aspectFill" />
                            ))}
                        </ScrollView>

                        <View className="footer-row">
                            <Text className="time">{order.created_at}</Text>
                            <View>
                                共 {order.items?.length || 0} 件商品，实付：
                                <Text className="price">¥{((order.pay_amount || 0) / 100).toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                )) : (
                    <View className="empty-state">
                        <Image className="icon" src="https://img12.360buyimg.com/img/s240x240_jfs/t1/181467/20/19052/15392/611a133fEbb8119eb/b2ab91fe9da248fd.png" mode="aspectFit" />
                        <Text>{loading ? '加载中...' : '暂无相关订单记录'}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    )
}
