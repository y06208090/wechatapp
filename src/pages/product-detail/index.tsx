import { useEffect, useState } from 'react'
import { View, Text, Image, ScrollView, Swiper, SwiperItem } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { get_product } from '../../api'
import { useCart } from '../../store/CartContext'
import './index.scss'

export default function ProductDetail() {
    const router = useRouter()
    const { id } = router.params
    const { addItem } = useCart()
    const [product, setProduct] = useState<any | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (id) {
            fetchProductDetail(id as string)
        }
    }, [id])

    const fetchProductDetail = async (productId: string) => {
        setLoading(true)
        try {
            const res = await get_product(productId)
            if (res) {
                setProduct(res)
            } else {
                throw new Error('未找到该商品')
            }
        } catch (e: any) {
            Taro.showToast({
                title: e.message || '获取商品失败',
                icon: 'none'
            })
            setTimeout(() => Taro.navigateBack(), 1500)
        } finally {
            setLoading(false)
        }
    }

    const goCart = () => {
        Taro.switchTab({ url: '/pages/cart/index' })
    }

    const handleAddCart = async () => {
        if (product) {
            await addItem(product)
            Taro.showToast({
                title: '已加入购物车',
                icon: 'success',
                duration: 1500
            })
        }
    }

    const handleBuyNow = async () => {
        if (product) {
            await addItem(product)
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
                        {product.images && product.images.length > 0 ? product.images.map((img: string, idx: number) => (
                            <SwiperItem key={idx}>
                                <Image className="swiper-img" src={img} mode="aspectFit" />
                            </SwiperItem>
                        )) : (
                            <SwiperItem>
                                <Image className="swiper-img" src={product.cover_image || product.imageUrl} mode="aspectFit" />
                            </SwiperItem>
                        )}
                    </Swiper>
                </View>

                {/* 价格与信息区 */}
                <View className="info-card section">
                    <View className="price-row">
                        <Text className="current-price">
                            <Text className="symbol">¥</Text>
                            {((product.price || 0) / 100).toFixed(2)}
                        </Text>
                        {product.original_price && (
                            <Text className="original-price">¥{((product.original_price || 0) / 100).toFixed(2)}</Text>
                        )}
                        {product.salesTag && (
                            <Text className="sales-badge">{product.salesTag}</Text>
                        )}
                    </View>
                    <View className="product-name">{product.title || product.name}</View>
                    <View className="product-desc">{product.subtitle || product.desc || '好物严选，品质保证'}</View>
                    {product.tags && product.tags.length > 0 && (
                        <View className="tags">
                            {product.tags.map((tag: string, idx: number) => (
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
