import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'

import { list_runner_orders } from '../../api'

import './index.scss'

const tabs = [
  { label: '全部', status: undefined },
  { label: '待付款', status: 'PENDING_PAY' },
  { label: '进行中', status: 'PROCESSING' },
  { label: '已完成', status: 'COMPLETED' },
]

const statusTextMap: Record<string, string> = {
  PENDING_PAY: '待付款',
  PENDING_ACCEPT: '待接单',
  PROCESSING: '代取中',
  DELIVERED: '已送达',
  COMPLETED: '已完成',
  CANCELED: '已取消',
  CLOSED: '已关闭',
}

export default function CourierOrder() {
  const [activeTab, setActiveTab] = useState(0)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    void fetchOrders(tabs[activeTab].status)
  })

  const fetchOrders = async (status?: string) => {
    setLoading(true)
    try {
      const result = await list_runner_orders(status ? { status } : undefined)
      setOrders(Array.isArray(result) ? result : [])
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '获取跑腿订单失败',
        icon: 'none',
      })
    } finally {
      setLoading(false)
    }
  }

  const visibleOrders = useMemo(() => orders, [orders])

  const switchTab = async (index: number) => {
    setActiveTab(index)
    await fetchOrders(tabs[index].status)
  }

  return (
    <View className="courier-order-page">
      <ScrollView className="tabs" scrollX>
        {tabs.map((tab, index) => (
          <View
            key={tab.label}
            className={`tab-item ${activeTab === index ? 'active' : ''}`}
            onClick={() => void switchTab(index)}
          >
            {tab.label}
          </View>
        ))}
      </ScrollView>

      <ScrollView className="order-list" scrollY>
        {visibleOrders.length > 0 ? (
          visibleOrders.map((order) => (
            <View
              key={order.runner_order_id}
              className="order-card"
              onClick={() =>
                Taro.navigateTo({
                  url: `/pages/courier-order-detail/index?id=${order.runner_order_id}`,
                })
              }
            >
              <View className="header">
                <Text className="sn">订单号: {order.runner_order_id}</Text>
                <Text className={`status ${order.status === 'PROCESSING' ? 'active' : ''}`}>
                  {statusTextMap[order.status] || order.status}
                </Text>
              </View>
              <View className="content">
                <View className="info-row">
                  <Text className="label">快递公司：</Text>
                  <Text>{order.express_company}</Text>
                </View>
                <View className="info-row">
                  <Text className="label">送达地址：</Text>
                  <Text>{order.delivery_address}</Text>
                </View>
                <View className="info-row">
                  <Text className="label">下单时间：</Text>
                  <Text>{formatDateTime(order.created_at)}</Text>
                </View>
              </View>
              <View className="footer">
                <View className="btn">查看详情</View>
                <View className="btn primary">
                  ¥{((order.amount_payable || 0) / 100).toFixed(2)}
                </View>
              </View>
            </View>
          ))
        ) : (
          <View className="empty">
            {loading ? '加载中...' : '还没有相关跑腿订单，先去下单一单试试'}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const formatDateTime = (value?: string) => (value ? value.replace('T', ' ').slice(0, 16) : '--')
