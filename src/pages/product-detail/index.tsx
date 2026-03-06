import { useEffect, useState } from 'react'
import { View, Text, Image, ScrollView, Swiper, SwiperItem } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { mockCategories, Product } from '../../mock/data'
import { useCart } from '../../store/CartContext'
import './index.scss'

export default function ProductDetail() {
    const router = useRouter()
    const { id } = router.params
    const { addItem } = useCart()
    const [product, setProduct] = useState<Product | null>(null)

    useEffect(() => {
        // 模拟服务端根据 ID 查询商品信息
        if (id) {
            let foundProduct: Product | undefined;
            for (const category of mockCategories) {
                foundProduct = category.products.find(p => p.id === id)
                if (foundProduct) break;
            }

            if (foundProduct) {
                setProduct(foundProduct)
            } else {
                Taro.showToast({
                    title: '未找到该商品',
                    icon: 'error'
                })
                setTimeout(() => Taro.navigateBack(), 1500)
            }
        }
    }, [id])

    const goCart = () => {
        Taro.switchTab({ url: '/pages/cart/index' })
    }

    const handleAddCart = () => {
        if (product) {
            addItem(product)
            Taro.showToast({
                title: '已加入购物车',
                icon: 'success',
                duration: 1500
            })
        }
    }

    const handleBuyNow = () => {
        if (product) {
            // 真实项目中可能会有单独的立即购买 API，这里为了Demo连贯性，
            // 我们模拟将商品加到购物车然后自动选中跳转（或者直接跳过去）
            addItem(product)
            setTimeout(() => {
                Taro.navigateTo({ url: '/pages/checkout/index' })
            }, 100)
        }
    }

    if (!product) {
        return <View className="loading">加载中...</View>
    }

    return (
        <View className="product-detail-page">
            <ScrollView className="scroll-content" scrollY>
                {/* 顶部主图区 */}
                <View className="swiper-container">
                    <Swiper
                        className="product-swiper"
                        indicatorDots
                        indicatorColor="rgba(0, 178, 106, 0.3)"
                        indicatorActiveColor="#00B26A"
                        circular
                        autoplay
                    >
                        {/* 假如商品有多张图，这里用单图模拟 3 张不同的角度展示 */}
                        <SwiperItem>
                            <Image className="swiper-img" src={product.imageUrl} mode="aspectFit" />
                        </SwiperItem>
                        <SwiperItem>
                            <Image className="swiper-img" src={product.imageUrl} mode="aspectFit" />
                        </SwiperItem>
                        <SwiperItem>
                            <Image className="swiper-img" src={product.imageUrl} mode="aspectFit" />
                        </SwiperItem>
                    </Swiper>
                </View>

                {/* 价格与信息区 */}
                <View className="info-card section">
                    <View className="price-row">
                        <Text className="current-price">
                            <Text className="symbol">¥</Text>
                            {product.price.toFixed(1)}
                        </Text>
                        {product.originalPrice && (
                            <Text className="original-price">¥{product.originalPrice.toFixed(1)}</Text>
                        )}
                        {product.salesTag && (
                            <Text className="sales-badge">{product.salesTag}</Text>
                        )}
                    </View>
                    <View className="product-name">{product.name}</View>
                    <View className="product-desc">{product.desc || '好物严选，品质保证'}</View>
                    {product.tags && product.tags.length > 0 && (
                        <View className="tags">
                            {product.tags.map((tag, idx) => (
                                <Text key={idx} className="tag-item">{tag}</Text>
                            ))}
                        </View>
                    )}
                </View>

                {/* 服务与规格选择 */}
                <View className="cell-group section">
                    <View className="cell">
                        <Text className="label">已选</Text>
                        <Text className="value">默认规格，1件</Text>
                        <Text className="arrow">{'>'}</Text>
                    </View>
                    <View className="cell">
                        <Text className="label">服务</Text>
                        <Text className="value">极速退款 · 正品保证 · 坏果包赔</Text>
                        <Text className="arrow">{'>'}</Text>
                    </View>
                </View>

                {/* 详情长图占位 */}
                <View className="detail-imgs section">
                    <View className="title-divider">
                        <View className="line"></View>
                        <Text className="text">商品详情</Text>
                        <View className="line"></View>
                    </View>

                    <View className="empty-detail">
                        <Text>—— 这是一张模拟的长图文介绍 ——</Text>
                        <View className="skeleton-box" style={{ height: '200px', backgroundColor: '#f0f0f0', margin: '20px 0' }}></View>
                        <View className="skeleton-box" style={{ height: '300px', backgroundColor: '#f0f0f0', margin: '20px 0' }}></View>
                        <Text>—— 已经到底啦 ——</Text>
                    </View>
                </View>
            </ScrollView>

            {/* 底部功能栏 */}
            <View className="bottom-bar">
                <View className="left-icons">
                    <View className="icon-item">
                        <Text className="icon">💬</Text>
                        <Text className="text">客服</Text>
                    </View>
                    <View className="icon-item" onClick={goCart}>
                        <Text className="icon">🛒</Text>
                        <Text className="text">购物车</Text>
                    </View>
                </View>
                <View className="right-btns">
                    <View className="btn add-cart" onClick={handleAddCart}>加入购物车</View>
                    <View className="btn buy-now" onClick={handleBuyNow}>立即购买</View>
                </View>
            </View>
        </View>
    )
}
