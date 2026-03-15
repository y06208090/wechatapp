import Taro, { useDidShow } from '@tarojs/taro'
import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Image, Input } from '@tarojs/components'

import { create_order, list_addresses, pay_order, preview_order } from '../../api'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import { AddressRecord, normalizeAddresses } from '../../utils/address'

import './index.scss'

export default function Checkout() {
    const { items, totalPrice, clearCart } = useCart()
    const { currentStore } = useStore()
    const [previewData, setPreviewData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [remark, setRemark] = useState('')
    const [addresses, setAddresses] = useState<AddressRecord[]>([])
    const [selectedAddress, setSelectedAddress] = useState<AddressRecord | null>(null)
    const [addressSheetVisible, setAddressSheetVisible] = useState(false)
    const currentStoreId = currentStore ? currentStore.id : ''
    const selectedAddressId = selectedAddress ? selectedAddress.id : undefined
    const currentStoreName = currentStore ? currentStore.name : '未知门店'
    const hasMultipleAddresses = addresses.length > 1

    const selectedItems = useMemo(
        () => items.filter((item) => item.selected && item.available !== false),
        [items],
    )
    const currentDistanceKm = useMemo(() => {
        if (!selectedAddress || !currentStore) {
            return undefined
        }
        return calcDistanceKm(
            currentStore.lat,
            currentStore.lng,
            selectedAddress.lat,
            selectedAddress.lng,
        )
    }, [selectedAddress, currentStore])

    useDidShow(() => {
        void fetchAddresses()
    })

    useEffect(() => {
        if (selectedItems.length > 0 && currentStoreId && selectedAddress) {
            void handlePreview()
            return
        }
        setPreviewData(null)
    }, [selectedAddress, currentStoreId, items])

    const fetchAddresses = async () => {
        try {
            const result = await list_addresses()
            const nextAddresses = normalizeAddresses(result)
            setAddresses(nextAddresses)

            if (nextAddresses.length === 0) {
                setSelectedAddress(null)
                return
            }

            const defaultAddress = nextAddresses.find((item) => item.isDefault)
            const preservedAddress =
                selectedAddress && nextAddresses.find((item) => item.id === selectedAddress.id)
            setSelectedAddress(preservedAddress || defaultAddress || nextAddresses[0])
        } catch (e: any) {
            Taro.showToast({ title: e.message || '获取地址失败', icon: 'none' })
        }
    }

    const handlePreview = async () => {
        if (!currentStoreId || selectedItems.length === 0 || !selectedAddress) {
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
                delivery_type: 'DELIVERY',
                distance_km: currentDistanceKm,
                address_id: selectedAddressId,
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
        if (!selectedAddress) {
            Taro.showToast({ title: '请选择收货地址', icon: 'none' })
            return
        }
        if (currentDistanceKm === undefined) {
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
                delivery_type: 'DELIVERY',
                distance_km: currentDistanceKm,
                address_id: selectedAddressId,
                address_snapshot: buildAddressSnapshot(selectedAddress),
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

    const goAddressManage = () => {
        setAddressSheetVisible(false)
        Taro.navigateTo({ url: '/pages/address/index' })
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
                    <View className="address-panel__header">
                        <Text className="address-panel__title">配送地址</Text>
                        {hasMultipleAddresses ? (
                            <View className="address-panel__switch" onClick={() => setAddressSheetVisible(true)}>
                                切换地址
                            </View>
                        ) : null}
                    </View>

                    {selectedAddress ? (
                        <View className="address-card">
                            <View className="address-card__top">
                                <Text className="address-card__name">{selectedAddress.name}</Text>
                                <Text className="address-card__phone">{selectedAddress.phone}</Text>
                                {selectedAddress.isDefault ? (
                                    <Text className="address-card__badge">默认地址</Text>
                                ) : null}
                            </View>
                            <Text className="address-card__detail">{selectedAddress.detail}</Text>
                            <View className="address-card__footer">
                                <Text className="address-card__store">由 {currentStoreName} 配送</Text>
                            </View>
                        </View>
                    ) : (
                        <View className="address-empty">
                            <Text className="address-empty__title">还没有收货地址</Text>
                            <Text className="address-empty__action">请先去地址页新增</Text>
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

                <View className="section remark-section">
                    <View className="remark-title">订单备注</View>
                    <Input
                        value={remark}
                        onInput={(e) => setRemark(e.detail.value)}
                        placeholder="请输入备注，选填无接触配送等"
                        className="remark-input"
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

            {addressSheetVisible ? (
                <View className="address-sheet-mask" onClick={() => setAddressSheetVisible(false)}>
                    <View className="address-sheet" onClick={(event) => event.stopPropagation()}>
                        <View className="address-sheet__header">
                            <Text className="address-sheet__title">选择配送地址</Text>
                            <Text className="address-sheet__close" onClick={() => setAddressSheetVisible(false)}>×</Text>
                        </View>
                        <ScrollView scrollY className="address-sheet__list">
                            {addresses.map((address) => (
                                <View
                                    key={address.id}
                                    className={`address-sheet__item ${selectedAddressId === address.id ? 'is-active' : ''}`}
                                    onClick={() => {
                                        setSelectedAddress(address)
                                        setAddressSheetVisible(false)
                                    }}
                                >
                                    <View className="address-sheet__item-top">
                                        <Text className="address-sheet__item-name">{address.name}</Text>
                                        <Text className="address-sheet__item-phone">{address.phone}</Text>
                                        {address.isDefault ? (
                                            <Text className="address-sheet__item-badge">默认</Text>
                                        ) : null}
                                    </View>
                                    <Text className="address-sheet__item-detail">{address.detail}</Text>
                                </View>
                            ))}
                        </ScrollView>
                        <View className="address-sheet__footer" onClick={goAddressManage}>
                            管理地址
                        </View>
                    </View>
                </View>
            ) : null}
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
        name: address.name,
        phone: address.phone,
        address: address.detail,
        detail: '',
        full_address: address.detail,
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
