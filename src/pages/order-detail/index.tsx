import { useState } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { get_order, pay_order } from '../../api'
import './index.scss'

export default function OrderDetail() {
    const router = useRouter()
    const { id } = router.params
    const [detail, setDetail] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useLoad(() => {
        if (id) {
            fetchDetail(id)
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
            await pay_order({ order_id: detail.id, pay_method: 'wechat' })
            Taro.showToast({ title: '支付成功模拟', icon: 'success' })
            fetchDetail(detail.id)
        } catch (e: any) {
            Taro.showToast({ title: e.message || '支付失败', icon: 'none' })
        } finally {
            Taro.hideLoading()
        }
    }

    if (!detail) {
        return <View className="loading-view">{loading ? '加载中...' : '订单不存在'}</View>
    }

    const { status, items, store, address } = detail

    const getStatusText = (s: string) => {
        const map: Record<string, string> = {
            'pending_payment': '等待支付',
            'paid': '等待接单/发货',
            'shipping': '配送中',
            'completed': '已完成',
            'refund': '退款售后中'
        }
        return map[s] || s
    }

    return (
        <View className="order-detail-page">
            <ScrollView className="main-scroll" scrollY>
                <View className="status-header">
                    <Text className="status-text">{getStatusText(status)}</Text>
                    {status === 'pending_payment' && <Text className="status-desc">请在15分钟内完成支付</Text>}
                    {status === 'paid' && <Text className="status-desc">商家正在急速备货中，请耐心等待</Text>}
                </View>

                {/* 外卖地址或自提展示区 */}
                <View className="section address-section">
                    <View className="info-row">
                        <Text className="label" style={{ fontWeight: 'bold', color: '#333' }}>
                            {detail.delivery_type === 'pickup' ? '到店自提' : '外卖配送'}
                        </Text>
                    </View>
                    {detail.delivery_type === 'delivery' && address ? (
                        <View style={{ marginTop: '8px' }}>
                            <View style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>
                                {address.contact_name} {address.phone}
                            </View>
                            <View style={{ fontSize: '13px', color: '#666' }}>
                                {address.address} {address.detail}
                            </View>
                        </View>
                    ) : (
                        <View style={{ marginTop: '8px' }}>
                            <View style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>
                                {store?.name || '特卖店'}
                            </View>
                            <View style={{ fontSize: '13px', color: '#666' }}>
                                取餐地址：{store?.address}
                            </View>
                        </View>
                    )}
                </View>

                {/* 商品明细区 */}
                <View className="section goods-section">
                    <View className="title">{store?.name || '小象超市'}</View>
                    {items && items.map((item: any, idx: number) => (
                        <View className="good-item" key={idx}>
                            <Image className="img" src={item.product?.cover_image} mode="aspectFill" />
                            <View className="info">
                                <View className="name">{item.product?.title || item.product?.name}</View>
                                <View className="bottom">
                                    <Text className="price">¥{((item.price || 0) / 100).toFixed(2)}</Text>
                                    <Text className="qty">x{item.quantity}</Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    {/* 费用统计 */}
                    <View style={{ marginTop: '16px', borderTop: '1px solid #f9f9f9', paddingTop: '12px' }}>
                        <View className="info-row">
                            <Text className="label">商品总价</Text>
                            <Text className="value">¥{((detail.total_amount || 0) / 100).toFixed(2)}</Text>
                        </View>
                        <View className="info-row">
                            <Text className="label">包装费</Text>
                            <Text className="value">¥0.00</Text>
                        </View>
                        <View className="info-row">
                            <Text className="label">配送费</Text>
                            <Text className="value">¥{((detail.delivery_fee || 0) / 100).toFixed(2)}</Text>
                        </View>
                        <View className="info-row" style={{ marginTop: '12px' }}>
                            <Text className="label"></Text>
                            <Text className="value" style={{ fontWeight: 'bold' }}>
                                订单实付 <Text style={{ color: '#E60012', fontSize: '16px' }}>¥{((detail.pay_amount || 0) / 100).toFixed(2)}</Text>
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 订单信息区 */}
                <View className="section info-section">
                    <View className="info-row">
                        <Text className="label">订单编号</Text>
                        <Text className="value">{detail.order_no || detail.id}</Text>
                    </View>
                    <View className="info-row">
                        <Text className="label">下单时间</Text>
                        <Text className="value">{detail.created_at}</Text>
                    </View>
                    {detail.remark && (
                        <View className="info-row">
                            <Text className="label">订单备注</Text>
                            <Text className="value">{detail.remark}</Text>
                        </View>
                    )}
                </View>

            </ScrollView>

            <View className="bottom-actions">
                <View className="btn plain">联系客服</View>
                {status === 'pending_payment' && (
                    <View className="btn primary" onClick={handlePay}>立即支付</View>
                )}
                {status === 'shipping' && (
                    <View className="btn primary">确认收货</View>
                )}
                {['paid', 'shipping'].includes(status) && (
                    <View className="btn plain">申请退款</View>
                )}
            </View>
        </View>
    )
}
