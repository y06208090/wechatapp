import Taro, { useDidShow } from '@tarojs/taro'
import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import { preview_order, create_order, pay_order } from '../../api'
import './index.scss'

export default function Checkout() {
    const { items, totalPrice, clearCart } = useCart()
    const { currentStore } = useStore()
    const [previewData, setPreviewData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [remark, setRemark] = useState('')

    // 配送方式：pickup(自提), delivery(外卖)
    const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup')
    const [selectedAddress, setSelectedAddress] = useState<any>(null)

    const selectedItems = items.filter(i => i.selected)

    useDidShow(() => {
        const addr = Taro.getStorageSync('selectedAddress')
        if (addr) {
            setSelectedAddress(addr)
            Taro.removeStorageSync('selectedAddress')
        }
    })

    useEffect(() => {
        if (selectedItems.length > 0 && currentStore?.id) {
            handlePreview()
        }
    }, [deliveryType, selectedAddress])

    const handlePreview = async () => {
        setLoading(true)
        try {
            const formData: any = {
                store_id: currentStore?.id,
                items: selectedItems.map(i => ({
                    product_id: i.id,
                    quantity: i.quantity
                })),
                delivery_type: deliveryType
            }
            if (deliveryType === 'delivery' && selectedAddress) {
                formData.address_id = selectedAddress.id
            }
            const res = await preview_order(formData)
            setPreviewData(res)
        } catch (e: any) {
            Taro.showToast({ title: e.message || '订单预览失败', icon: 'none' })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitOrder = async () => {
        if (deliveryType === 'delivery' && !selectedAddress) {
            Taro.showToast({ title: '请选择收货地址', icon: 'none' })
            return
        }
        if (!previewData) return

        try {
            Taro.showLoading({ title: '提交中...' })
            const createRes = await create_order({
                store_id: currentStore?.id,
                items: selectedItems.map(i => ({
                    product_id: i.id,
                    quantity: i.quantity
                })),
                delivery_type: deliveryType,
                address_id: deliveryType === 'delivery' ? selectedAddress?.id : undefined,
                remark,
            })

            if (createRes && createRes.id) {
                // 唤起支付逻辑
                const payRes = await pay_order({ order_id: createRes.id, pay_method: 'wechat' })

                // 模拟支付成功后清空购物车并跳转订单详情/列表
                Taro.showToast({ title: '下单成功', icon: 'success' })
                await clearCart()

                setTimeout(() => {
                    Taro.switchTab({ url: '/pages/order/index' })
                }, 1500)
            }

        } catch (e: any) {
            Taro.showToast({ title: e.message || '下单失败', icon: 'none' })
        } finally {
            Taro.hideLoading()
        }
    }

    const goAddressSelect = () => {
        Taro.navigateTo({ url: '/pages/address/index?from=checkout' })
    }

    return (
        <View className="checkout-page">
            <ScrollView scrollY className="content">
                <View className="section address-section">
                    <View className="delivery-type">
                        <Text
                            className={deliveryType === 'pickup' ? 'active' : ''}
                            onClick={() => setDeliveryType('pickup')}
                        >
                            到店自提
                        </Text>
                        <Text
                            className={deliveryType === 'delivery' ? 'active' : ''}
                            onClick={() => setDeliveryType('delivery')}
                        >
                            外卖配送
                        </Text>
                    </View>

                    {deliveryType === 'pickup' ? (
                        <View className="store-info">
                            <Text className="name">{currentStore?.name || '未知门店'}</Text>
                            <Text className="address">{currentStore?.address || '未能获取门店地址'}</Text>
                        </View>
                    ) : (
                        <View className="address-info" onClick={goAddressSelect}>
                            {selectedAddress ? (
                                <>
                                    <View className="contact">
                                        <Text className="name">{selectedAddress.contact_name}</Text>
                                        <Text className="phone">{selectedAddress.phone}</Text>
                                    </View>
                                    <View className="detail">{selectedAddress.address} {selectedAddress.detail}</View>
                                </>
                            ) : (
                                <Text className="placeholder">请选择收货地址 {'>'}</Text>
                            )}
                        </View>
                    )}
                </View>

                <View className="section goods-section">
                    <View className="title">商品明细</View>
                    {selectedItems.map(item => (
                        <View className="good-item" key={item.id}>
                            <Image className="img" src={item.imageUrl} mode="aspectFill" />
                            <View className="info">
                                <View className="name">{item.name}</View>
                                <View className="bottom">
                                    <Text className="price">¥{((item.price || 0) / 100).toFixed(2)}</Text>
                                    <Text className="count">x{item.quantity}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                <View className="section remark-section" style={{ padding: '16px', background: '#fff', borderRadius: '8px', marginBottom: '12px' }}>
                    <View style={{ fontSize: '14px', marginBottom: '8px' }}>订单备注</View>
                    <Input
                        value={remark}
                        onInput={(e) => setRemark(e.detail.value)}
                        placeholder="请输入备注选填无接触配送等"
                        style={{ fontSize: '13px', background: '#f5f5f5', padding: '8px 12px', borderRadius: '4px' }}
                    />
                </View>

                <View className="section fee-section">
                    <View className="fee-row">
                        <Text>商品总计</Text>
                        <Text>¥{previewData ? (previewData.total_amount / 100).toFixed(2) : ((totalPrice || 0) / 100).toFixed(2)}</Text>
                    </View>
                    <View className="fee-row">
                        <Text>配送费</Text>
                        <Text>¥{previewData ? (previewData.delivery_fee / 100).toFixed(2) : '0.00'}</Text>
                    </View>
                    <View className="fee-row">
                        <Text>包装费</Text>
                        <Text>¥{previewData ? (previewData.pack_fee / 100).toFixed(2) : '0.00'}</Text>
                    </View>
                </View>

            </ScrollView>

            <View className="bottom-bar">
                <View className="total">
                    <Text className="label">合计：</Text>
                    <Text className="price">
                        ¥{previewData ? (previewData.pay_amount / 100).toFixed(2) : ((totalPrice || 0) / 100).toFixed(2)}
                    </Text>
                </View>
                <View className="submit-btn" onClick={handleSubmitOrder}>
                    {loading ? '处理中...' : '去支付'}
                </View>
            </View>
        </View>
    )
}
