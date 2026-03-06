import { useMemo } from 'react'
import { View, Text, Image, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useCart } from '../../store/CartContext'
import { useUser } from '../../store/UserContext'
import './index.scss'

export default function Checkout() {
    const { items, clearCart } = useCart()
    const { userInfo } = useUser()

    // 结算清单仅包含在购物车里被 selected 的项
    const checkoutItems = useMemo(() => {
        return items.filter(item => item.selected)
    }, [items])

    const goodsTotal = useMemo(() => {
        return checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }, [checkoutItems])

    // 模拟配送费、打折活动等
    const shippingFee = goodsTotal > 39 ? 0 : 5
    // 这里可以写更多的满减活动、优惠券逻辑
    const couponDiscount = 0
    const realPay = goodsTotal + shippingFee - couponDiscount

    const handlePay = () => {
        if (checkoutItems.length === 0) {
            Taro.showToast({ title: '没有可结算商品', icon: 'none' })
            return
        }

        Taro.showLoading({ title: '拉起微信支付...', mask: true })

        // 模拟等待微信支付输入密码回调成功
        setTimeout(() => {
            Taro.hideLoading()

            // 其实这里应该只移出已结算的，由于当前用简单上下文，我们为了Demo提供清空选中购物车的模拟
            clearCart() // 我们暂时把清除全部作为一种清空

            Taro.showToast({
                title: '支付完成！',
                icon: 'success',
                duration: 1500
            })

            // 支付成功后自动跳到我的订单页看结果
            setTimeout(() => {
                Taro.navigateTo({ url: '/pages/order/index' })
            }, 1500)

        }, 1500)
    }

    const goAddress = () => {
        Taro.navigateTo({ url: '/pages/address/index' })
    }

    if (checkoutItems.length === 0) {
        return (
            <View className="empty-wrap">
                <Text>暂无商品结算数据</Text>
                <Button onClick={() => Taro.navigateBack()}>返回</Button>
            </View>
        )
    }

    return (
        <View className="checkout-page">
            <ScrollView scrollY className="content">
                {/* 地址区 */}
                <View className="address-card" onClick={goAddress}>
                    <View className="info">
                        <View className="tag-name">
                            <Text className="tag">默认</Text>
                            <Text className="address-detail">南区3栋201宿舍</Text>
                        </View>
                        <View className="user">小象士兵 138****8888</View>
                    </View>
                    <Text className="arrow">{'>'}</Text>
                </View>
                <View className="address-line"></View>

                {/* 订单商品区 */}
                <View className="goods-card">
                    <View className="shop-title">部队小店</View>
                    {checkoutItems.map((item) => (
                        <View className="goods-item" key={item.id}>
                            <Image className="pic" src={item.imageUrl} mode="aspectFill" />
                            <View className="detail">
                                <View className="name">{item.name}</View>
                                {item.desc && <View className="desc">{item.desc}</View>}
                                <View className="price-num">
                                    <Text className="price">¥{item.price.toFixed(1)}</Text>
                                    <Text className="num">x{item.quantity}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 费用明细 */}
                <View className="fee-card">
                    <View className="fee-row">
                        <Text className="label">商品总额</Text>
                        <Text className="value">¥{goodsTotal.toFixed(1)}</Text>
                    </View>
                    <View className="fee-row">
                        <Text className="label">配送费</Text>
                        <Text className="value">{shippingFee === 0 ? '免邮' : `¥${shippingFee.toFixed(1)}`}</Text>
                    </View>
                    <View className="fee-row">
                        <Text className="label">优惠券</Text>
                        <Text className="value gray">{userInfo.coupons > 0 ? `有${userInfo.coupons}张可用优惠券` : '暂无可用'}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* 底部支付付款栏 */}
            <View className="pay-bar">
                <View className="amount-info">
                    <Text className="text">合计:</Text>
                    <Text className="symbol">¥</Text>
                    <Text className="amount">{realPay.toFixed(2)}</Text>
                </View>
                <View className="pay-btn" onClick={handlePay}>微信支付</View>
            </View>
        </View>
    )
}
