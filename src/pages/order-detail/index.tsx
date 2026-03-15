import { useState } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'

import {
    cancel_order,
    get_order,
    pay_order,
    repurchase_order,
    simulate_progress_order,
} from '../../api'

import './index.scss'

const statusTextMap: Record<string, string> = {
    PENDING_PAY: '等待支付',
    PENDING_ACCEPT: '等待接单',
    ACCEPTED: '备货中',
    DELIVERING: '配送中',
    WAITING_PICKUP: '待提货',
    COMPLETED: '已完成',
    CANCELED: '已取消',
    CLOSED: '已关闭',
}

export default function OrderDetail() {
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
            const res = await get_order(orderId)
            if (res) {
                setDetail(res)
            }
        } catch (e: any) {
            Taro.showToast({ title: e.message || '获取订单详情失败', icon: 'none' })
        } finally {
            setLoading(false)
        }
    }

    const handlePay = async () => {
        if (!detail) return
        try {
            Taro.showLoading({ title: '拉起支付...' })
            await pay_order({ order_id: detail.order_id })
            Taro.showToast({ title: '支付成功模拟', icon: 'success' })
            await fetchDetail(detail.order_id)
        } catch (e: any) {
            Taro.showToast({ title: e.message || '支付失败', icon: 'none' })
        } finally {
            Taro.hideLoading()
        }
    }

    const handleSimulateNext = async () => {
        if (!detail) return
        try {
            Taro.showLoading({ title: '推进中...' })
            await simulate_progress_order(detail.order_id, { action: 'NEXT' })
            Taro.showToast({ title: '订单状态已推进', icon: 'success' })
            await fetchDetail(detail.order_id)
        } catch (e: any) {
            Taro.showToast({ title: e.message || '推进失败', icon: 'none' })
        } finally {
            Taro.hideLoading()
        }
    }

    const handleCancel = async () => {
        if (!detail) return
        try {
            Taro.showLoading({ title: '取消中...' })
            await cancel_order(detail.order_id, { reason: '用户主动取消' })
            Taro.showToast({ title: '订单已取消', icon: 'success' })
            await fetchDetail(detail.order_id)
        } catch (e: any) {
            Taro.showToast({ title: e.message || '取消失败', icon: 'none' })
        } finally {
            Taro.hideLoading()
        }
    }

    const handleRepurchase = async () => {
        if (!detail) return
        try {
            Taro.showLoading({ title: '处理中...' })
            const res = await repurchase_order(detail.order_id)
            Taro.showToast({ title: '已再次下单', icon: 'success' })
            setTimeout(() => {
                Taro.redirectTo({ url: `/pages/order-detail/index?id=${res.order_id}` })
            }, 1200)
        } catch (e: any) {
            Taro.showToast({ title: e.message || '再次下单失败', icon: 'none' })
        } finally {
            Taro.hideLoading()
        }
    }

    if (!detail) {
        return <View className="loading-view">{loading ? '加载中...' : '订单不存在'}</View>
    }

    const { status, items } = detail
    const store = detail.store_snapshot
    const address = detail.address_snapshot

    const getStatusDesc = () => {
        if (status === 'PENDING_PAY') return '支付后可继续模拟接单与履约流程'
        if (status === 'PENDING_ACCEPT') return '下一步可以模拟商家接单'
        if (status === 'ACCEPTED') return detail.delivery_type === 'PICKUP' ? '下一步可以模拟备货完成' : '下一步可以模拟开始配送'
        if (status === 'DELIVERING' || status === 'WAITING_PICKUP') return '下一步可以确认订单完成'
        return '订单状态已稳定，可查看完整记录'
    }

    const getProgressActionText = () => {
        if (status === 'PENDING_ACCEPT') return '模拟商家接单'
        if (status === 'ACCEPTED') return detail.delivery_type === 'PICKUP' ? '模拟备货完成' : '模拟开始配送'
        if (status === 'DELIVERING' || status === 'WAITING_PICKUP') return detail.delivery_type === 'PICKUP' ? '确认提货' : '确认收货'
        return ''
    }

    const formatDateTime = (value?: string) => value ? value.replace('T', ' ').slice(0, 16) : '--'
    const storeName = store && store.name ? store.name : '小象超市门店'
    const storeAddress = store && store.address ? store.address : '门店地址待确认'
    const goodsSectionStoreName = store && store.name ? store.name : '小象超市'
    const deliveryAddressText = address
        ? address.full_address || [address.address, address.detail].filter(Boolean).join(' ')
        : ''

    return (
        <View className="order-detail-page">
            <ScrollView className="main-scroll" scrollY>
                <View className="status-header">
                    <Text className="status-text">{statusTextMap[status] || status}</Text>
                    <Text className="status-desc">{getStatusDesc()}</Text>
                </View>

                <View className="section address-section">
                    <View className="info-row">
                        <Text className="label" style={{ fontWeight: 'bold', color: '#333' }}>
                            {detail.delivery_type === 'PICKUP' ? '到店自提' : '外卖配送'}
                        </Text>
                    </View>
                    {detail.delivery_type === 'DELIVERY' && address ? (
                        <View style={{ marginTop: '8px' }}>
                            <View style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>
                                {address.name} {address.phone}
                            </View>
                            <View style={{ fontSize: '13px', color: '#666' }}>
                                {deliveryAddressText}
                            </View>
                        </View>
                    ) : (
                        <View style={{ marginTop: '8px' }}>
                            <View style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>
                                {storeName}
                            </View>
                            <View style={{ fontSize: '13px', color: '#666' }}>
                                取货地址：{storeAddress}
                            </View>
                        </View>
                    )}
                </View>

                <View className="section goods-section">
                    <View className="title">{goodsSectionStoreName}</View>
                    {items && items.map((item: any, idx: number) => (
                        <View className="good-item" key={idx}>
                            <Image className="img" src="https://dummyimage.com/120x120/e5e7eb/9ca3af.png&text=%E5%95%86%E5%93%81" mode="aspectFill" />
                            <View className="info">
                                <View className="name">{item.title_snapshot}</View>
                                <View className="bottom">
                                    <Text className="price">¥{((item.price_snapshot || 0) / 100).toFixed(2)}</Text>
                                    <Text className="qty">x{item.qty}</Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    <View style={{ marginTop: '16px', borderTop: '1px solid #f9f9f9', paddingTop: '12px' }}>
                        <View className="info-row">
                            <Text className="label">商品总价</Text>
                            <Text className="value">¥{((detail.amount_goods || 0) / 100).toFixed(2)}</Text>
                        </View>
                        <View className="info-row">
                            <Text className="label">优惠金额</Text>
                            <Text className="value">-¥{((detail.amount_discount || 0) / 100).toFixed(2)}</Text>
                        </View>
                        <View className="info-row">
                            <Text className="label">配送费</Text>
                            <Text className="value">¥{((detail.amount_delivery_fee || 0) / 100).toFixed(2)}</Text>
                        </View>
                        <View className="info-row" style={{ marginTop: '12px' }}>
                            <Text className="label"></Text>
                            <Text className="value" style={{ fontWeight: 'bold' }}>
                                订单实付 <Text style={{ color: '#E60012', fontSize: '16px' }}>¥{((detail.amount_payable || 0) / 100).toFixed(2)}</Text>
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="section info-section">
                    <View className="info-row">
                        <Text className="label">订单编号</Text>
                        <Text className="value">{detail.order_id}</Text>
                    </View>
                    <View className="info-row">
                        <Text className="label">下单时间</Text>
                        <Text className="value">{formatDateTime(detail.created_at)}</Text>
                    </View>
                    {detail.pay_time && (
                        <View className="info-row">
                            <Text className="label">支付时间</Text>
                            <Text className="value">{formatDateTime(detail.pay_time)}</Text>
                        </View>
                    )}
                    {detail.accept_time && (
                        <View className="info-row">
                            <Text className="label">接单时间</Text>
                            <Text className="value">{formatDateTime(detail.accept_time)}</Text>
                        </View>
                    )}
                    {detail.complete_time && (
                        <View className="info-row">
                            <Text className="label">完成时间</Text>
                            <Text className="value">{formatDateTime(detail.complete_time)}</Text>
                        </View>
                    )}
                    {detail.remark && (
                        <View className="info-row">
                            <Text className="label">订单备注</Text>
                            <Text className="value">{detail.remark}</Text>
                        </View>
                    )}
                    {detail.cancel_reason && (
                        <View className="info-row">
                            <Text className="label">取消原因</Text>
                            <Text className="value">{detail.cancel_reason}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View className="bottom-actions">
                <View className="btn plain">联系客服</View>
                {status === 'PENDING_PAY' && (
                    <View className="btn plain" onClick={handleCancel}>取消订单</View>
                )}
                {status === 'PENDING_PAY' && (
                    <View className="btn primary" onClick={handlePay}>立即支付</View>
                )}
                {(status === 'PENDING_ACCEPT' || status === 'ACCEPTED' || status === 'DELIVERING' || status === 'WAITING_PICKUP') && (
                    <View className="btn primary" onClick={handleSimulateNext}>{getProgressActionText()}</View>
                )}
                {status === 'COMPLETED' && (
                    <View className="btn primary" onClick={handleRepurchase}>再来一单</View>
                )}
            </View>
        </View>
    )
}
