import Taro, { useDidShow } from '@tarojs/taro'
import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Image, Input } from '@tarojs/components'

import { create_order, pay_order, preview_order } from '../../api'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'

import './index.scss'

export default function Checkout() {
    const { items, totalPrice, clearCart } = useCart()
    const { currentStore } = useStore()
    const [previewData, setPreviewData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [remark, setRemark] = useState('')
    const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup')
    const [selectedAddress, setSelectedAddress] = useState<any>(null)
    const currentStoreId = currentStore ? currentStore.id : ''
    const selectedAddressId = selectedAddress ? selectedAddress.id : undefined
    const currentStoreName = currentStore ? currentStore.name : '未知门店'
    const currentStoreAddress = currentStore ? currentStore.address : '未能获取门店地址'

    const selectedItems = useMemo(
        () => items.filter((item) => item.selected),
        [items],
    )
    const currentDistanceKm = useMemo(() => {
        if (deliveryType !== 'delivery') {
            return undefined
        }
        if (!selectedAddress || !currentStore) {
            return undefined
        }
        return calcDistanceKm(
            currentStore.lat,
            currentStore.lng,
            selectedAddress.lat,
            selectedAddress.lng,
        )
    }, [deliveryType, selectedAddress, currentStore])

    useDidShow(() => {
        const addr = Taro.getStorageSync('selectedAddress')
        if (addr) {
            setSelectedAddress(addr)
            Taro.removeStorageSync('selectedAddress')
        }
    })

    useEffect(() => {
        if (selectedItems.length > 0 && currentStoreId) {
            void handlePreview()
        } else {
            setPreviewData(null)
        }
    }, [deliveryType, selectedAddress, currentStoreId, items])

    const handlePreview = async () => {
        if (!currentStoreId || selectedItems.length === 0) {
            return
        }

        setLoading(true)
        try {
            const formData: any = {
                store_id: currentStoreId,
                items: selectedItems.map((item) => ({
                    product_id: item.id,
                    title_snapshot: item.name,
                    price_snapshot: item.price,
                    qty: item.quantity,
                })),
                delivery_type: deliveryType === 'pickup' ? 'PICKUP' : 'DELIVERY',
                distance_km: deliveryType === 'delivery' ? currentDistanceKm : undefined,
            }
            if (deliveryType === 'delivery' && selectedAddressId) {
                formData.address_id = selectedAddressId
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
        if (!currentStoreId) {
            Taro.showToast({ title: '请先选择门店', icon: 'none' })
            return
        }
        if (selectedItems.length === 0) {
            Taro.showToast({ title: '请先选择商品', icon: 'none' })
            return
        }
        if (deliveryType === 'delivery' && !selectedAddress) {
            Taro.showToast({ title: '请选择收货地址', icon: 'none' })
            return
        }
        if (deliveryType === 'delivery' && currentDistanceKm === undefined) {
            Taro.showToast({ title: '无法计算配送距离', icon: 'none' })
            return
        }

        try {
            Taro.showLoading({ title: '提交中...' })
            const createRes = await create_order({
                store_id: currentStoreId,
                items: selectedItems.map((item) => ({
                    product_id: item.id,
                    title_snapshot: item.name,
                    price_snapshot: item.price,
                    qty: item.quantity,
                })),
                delivery_type: deliveryType === 'pickup' ? 'PICKUP' : 'DELIVERY',
                distance_km: deliveryType === 'delivery' ? currentDistanceKm : undefined,
                address_id: deliveryType === 'delivery' ? selectedAddressId : undefined,
                address_snapshot:
                    deliveryType === 'delivery'
                        ? buildAddressSnapshot(selectedAddress)
                        : undefined,
                store_snapshot: buildStoreSnapshot(currentStore),
                remark: remark.trim() || undefined,
            })

            if (!createRes || !createRes.order_id) {
                throw new Error('订单创建失败')
            }

            await pay_order({ order_id: createRes.order_id })
            Taro.showToast({ title: '下单成功', icon: 'success' })
            await clearCart()

            setTimeout(() => {
                Taro.redirectTo({
                    url: `/pages/order-detail/index?id=${createRes.order_id}`,
                })
            }, 1200)
        } catch (e: any) {
            Taro.showToast({ title: e.message || '下单失败', icon: 'none' })
        } finally {
            Taro.hideLoading()
        }
    }

    const goAddressSelect = () => {
        Taro.navigateTo({ url: '/pages/address/index?from=checkout' })
    }

    if (selectedItems.length === 0) {
        return (
            <View className="checkout-page">
                <View className="empty-checkout">
                    <Text className="empty-title">还没有可结算的商品</Text>
                    <Text className="empty-subtitle">先去首页挑选商品，再回来下单</Text>
                    <View
                        className="empty-action"
                        onClick={() => Taro.switchTab({ url: '/pages/category/index' })}
                    >
                        去选商品
                    </View>
                </View>
            </View>
        )
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
                            <Text className="name">{currentStoreName}</Text>
                            <Text className="address">{currentStoreAddress}</Text>
                        </View>
                    ) : (
                        <View className="address-info" onClick={goAddressSelect}>
                            {selectedAddress ? (
                                <>
                                    <View className="contact">
                                        <Text className="name">{selectedAddress.contact_name || selectedAddress.name}</Text>
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
                    {selectedItems.map((item) => (
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
                        placeholder="请输入备注，选填无接触配送等"
                        style={{ fontSize: '13px', background: '#f5f5f5', padding: '8px 12px', borderRadius: '4px' }}
                    />
                </View>

                <View className="section fee-section">
                    <View className="fee-row">
                        <Text>商品总计</Text>
                        <Text>¥{previewData ? (previewData.amount_goods / 100).toFixed(2) : ((totalPrice || 0) / 100).toFixed(2)}</Text>
                    </View>
                    <View className="fee-row">
                        <Text>配送费</Text>
                        <Text>¥{previewData ? (previewData.amount_delivery_fee / 100).toFixed(2) : '0.00'}</Text>
                    </View>
                    <View className="fee-row">
                        <Text>优惠金额</Text>
                        <Text>-¥{previewData ? (previewData.amount_discount / 100).toFixed(2) : '0.00'}</Text>
                    </View>
                </View>
            </ScrollView>

            <View className="bottom-bar">
                <View className="total">
                    <Text className="label">合计：</Text>
                    <Text className="price">
                        ¥{previewData ? (previewData.amount_payable / 100).toFixed(2) : ((totalPrice || 0) / 100).toFixed(2)}
                    </Text>
                </View>
                <View className="submit-btn" onClick={handleSubmitOrder}>
                    {loading ? '处理中...' : '去支付'}
                </View>
            </View>
        </View>
    )
}

const buildStoreSnapshot = (store: any) => ({
    id: store.id,
    name: store.name,
    address: store.address,
    phone: store.phone,
    business_hours: store.business_hours,
})

const buildAddressSnapshot = (address: any) => {
    if (!address) {
        return undefined
    }

    return {
        address_id: address.id,
        name: address.contact_name || address.name,
        phone: address.phone,
        address: address.address,
        detail: address.detail,
        lat: address.lat,
        lng: address.lng,
    }
}

const calcDistanceKm = (lat1?: number, lng1?: number, lat2?: number, lng2?: number) => {
    if (
        typeof lat1 !== 'number' ||
        typeof lng1 !== 'number' ||
        typeof lat2 !== 'number' ||
        typeof lng2 !== 'number'
    ) {
        return undefined
    }

    const toRad = (value: number) => (value * Math.PI) / 180
    const earthRadiusKm = 6371
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Number((earthRadiusKm * c).toFixed(2))
}
