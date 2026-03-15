import { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'

import { cancel_runner_order, get_runner_order, pay_runner_order } from '../../api'

import './index.scss'

const statusTextMap: Record<string, string> = {
  PENDING_PAY: '待付款',
  PENDING_ACCEPT: '待接单',
  PROCESSING: '代取中',
  DELIVERED: '已送达',
  COMPLETED: '已完成',
  CANCELED: '已取消',
  CLOSED: '已关闭',
}

export default function CourierOrderDetail() {
  const router = useRouter()
  const { id } = router.params
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useLoad(() => {
    if (id) {
      void fetchDetail(id)
    }
  })

  const fetchDetail = async (orderId: string) => {
    setLoading(true)
    try {
      const result = await get_runner_order(orderId)
      setDetail(result)
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '获取订单详情失败',
        icon: 'none',
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    if (!detail) {
      return
    }
    try {
      Taro.showLoading({ title: '支付中...' })
      await pay_runner_order({ runner_order_id: detail.runner_order_id })
      Taro.showToast({ title: '支付成功', icon: 'success' })
      await fetchDetail(detail.runner_order_id)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '支付失败', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  }

  const handleCancel = async () => {
    if (!detail) {
      return
    }
    const modal = await Taro.showModal({
      title: '取消订单',
      content: '确认取消这笔跑腿订单吗？',
    })
    if (!modal.confirm) {
      return
    }
    try {
      Taro.showLoading({ title: '取消中...' })
      await cancel_runner_order(detail.runner_order_id, { reason: '用户主动取消' })
      Taro.showToast({ title: '订单已取消', icon: 'success' })
      await fetchDetail(detail.runner_order_id)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '取消失败', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  }

  if (!detail) {
    return <View className="loading-view">{loading ? '加载中...' : '订单不存在'}</View>
  }

  return (
    <View className="courier-order-detail-page">
      <ScrollView className="main-scroll" scrollY>
        <View className="status-header">
          <Text className="status-text">{statusTextMap[detail.status] || detail.status}</Text>
          <Text className="status-desc">
            {detail.status === 'PENDING_PAY'
              ? '订单已创建，完成支付后会进入商家接单流程'
              : detail.status === 'PENDING_ACCEPT'
                ? '跑腿订单已支付，等待商家接单'
                : detail.status === 'PROCESSING'
                  ? '跑腿员正在代取并配送中'
                  : detail.status === 'DELIVERED'
                    ? '订单已送达，等待系统确认完成'
                    : '订单流程已结束'}
          </Text>
        </View>

        <View className="section">
          <Text className="section-title">配送信息</Text>
          <View className="section-line">
            <Text>快递公司</Text>
            <Text className="section-value">{detail.express_company}</Text>
          </View>
          <View className="section-line">
            <Text>取件码</Text>
            <Text className="section-value">{detail.pickup_code}</Text>
          </View>
          <View className="section-line">
            <Text>送达地址</Text>
            <Text className="section-value">{detail.delivery_address}</Text>
          </View>
          <View className="section-line">
            <Text>收件人</Text>
            <Text className="section-value">{detail.receiver_name} {detail.receiver_phone}</Text>
          </View>
          {detail.remark ? (
            <View className="section-line">
              <Text>备注</Text>
              <Text className="section-value">{detail.remark}</Text>
            </View>
          ) : null}
        </View>

        <View className="section">
          <Text className="section-title">费用信息</Text>
          <View className="section-line">
            <Text>服务费</Text>
            <Text className="section-value amount">
              ¥{((detail.service_fee || 0) / 100).toFixed(2)}
            </Text>
          </View>
          <View className="section-line">
            <Text>应付金额</Text>
            <Text className="section-value amount">
              ¥{((detail.amount_payable || 0) / 100).toFixed(2)}
            </Text>
          </View>
          <View className="section-line">
            <Text>配送距离</Text>
            <Text className="section-value">
              {detail.distance_km !== undefined && detail.distance_km !== null
                ? `${detail.distance_km.toFixed(2)}km`
                : '--'}
            </Text>
          </View>
        </View>

        <View className="section">
          <Text className="section-title">订单信息</Text>
          <View className="meta-line">
            <Text className="meta-label">订单号</Text>
            <Text className="meta-value">{detail.runner_order_id}</Text>
          </View>
          <View className="meta-line">
            <Text className="meta-label">支付状态</Text>
            <Text className="meta-value">{detail.pay_status}</Text>
          </View>
          <View className="meta-line">
            <Text className="meta-label">下单时间</Text>
            <Text className="meta-value">{formatDateTime(detail.created_at)}</Text>
          </View>
          {detail.pay_time ? (
            <View className="meta-line">
              <Text className="meta-label">支付时间</Text>
              <Text className="meta-value">{formatDateTime(detail.pay_time)}</Text>
            </View>
          ) : null}
          {detail.accept_time ? (
            <View className="meta-line">
              <Text className="meta-label">接单时间</Text>
              <Text className="meta-value">{formatDateTime(detail.accept_time)}</Text>
            </View>
          ) : null}
          {detail.delivered_time ? (
            <View className="meta-line">
              <Text className="meta-label">送达时间</Text>
              <Text className="meta-value">{formatDateTime(detail.delivered_time)}</Text>
            </View>
          ) : null}
          {detail.complete_time ? (
            <View className="meta-line">
              <Text className="meta-label">完成时间</Text>
              <Text className="meta-value">{formatDateTime(detail.complete_time)}</Text>
            </View>
          ) : null}
          {detail.cancel_reason ? (
            <View className="meta-line">
              <Text className="meta-label">取消原因</Text>
              <Text className="meta-value">{detail.cancel_reason}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View className="bottom-actions">
        <View
          className="action-btn"
          onClick={() => Taro.redirectTo({ url: '/pages/courier-order/index' })}
        >
          订单列表
        </View>
        {detail.status === 'PENDING_PAY' ? (
          <View className="action-btn danger" onClick={() => void handleCancel()}>
            取消订单
          </View>
        ) : null}
        {detail.status === 'PENDING_PAY' ? (
          <View className="action-btn primary" onClick={() => void handlePay()}>
            立即支付
          </View>
        ) : null}
      </View>
    </View>
  )
}

const formatDateTime = (value?: string) => (value ? value.replace('T', ' ').slice(0, 16) : '--')
