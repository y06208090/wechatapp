import React, { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Input, Navigator } from '@tarojs/components'
import { mockCategories } from '../../mock/data'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import { list_categories, list_products } from '../../api'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'

export default function Category() {
  const [activeCategoryId, setActiveCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { addItem } = useCart()
  const { currentStore } = useStore() // 获取当前选中门店

  useLoad(() => {
    // 首次进入加载门店分类
  })

  useEffect(() => {
    if (currentStore && currentStore.id) {
      fetchCategories(currentStore.id)
    }
  }, [currentStore])

  useEffect(() => {
    if (currentStore && currentStore.id && activeCategoryId) {
      fetchProducts(currentStore.id, activeCategoryId)
    }
  }, [currentStore, activeCategoryId])

  const fetchCategories = async (storeId: string) => {
    try {
      const res = await list_categories({ store_id: storeId })
      if (res && res.length > 0) {
        setCategories(res)
        setActiveCategoryId(res[0].id)
      } else {
        setCategories([])
      }
    } catch (e) {
      console.error('获取分类失败', e)
    }
  }

  const fetchProducts = async (storeId: string, categoryId: string) => {
    setLoading(true)
    try {
      const res = await list_products({ store_id: storeId, category_id: categoryId })
      if (res && res.items) {
        setProducts(res.items)
      } else {
        setProducts([])
      }
    } catch (e) {
      console.error('获取商品失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCart = async (e: any, product: any) => {
    e.stopPropagation();
    try {
      await addItem({
        id: product.id,
        name: product.title || product.name,
        price: product.price,
        imageUrl: product.cover_image || product.imageUrl
      });
      Taro.showToast({
        title: '已加入购物车',
        icon: 'success',
        duration: 1000,
      });
    } catch (e) { }
  }

  const handleGoDetail = (id: string) => {
    Taro.navigateTo({
      url: `/pages/product-detail/index?id=${id}`
    })
  }

  // Fallback to mock data if real API yields nothing in dev
  const displayCategories = categories.length > 0 ? categories : mockCategories
  const displayProducts = products.length > 0 ? products : (activeCategoryId ? (mockCategories.find(c => c.id === activeCategoryId)?.products || []) : [])

  return (
    <View className="category-page">
      <View className="search-bar">
        <Input className="search-input" placeholder="解腻水饮料好喝无腹忧" />
      </View>

      <Navigator url="/pages/courier/index" className="courier-banner">
        <View className="courier-banner-left">
          <View className="icon-wrapper">
            <Text className="icon">📦</Text>
          </View>
          <View className="text-info">
            <Text className="banner-title">顺路代取快递</Text>
            <Text className="banner-subtitle">随时下单，最快30分钟送达桌前</Text>
          </View>
        </View>
        <View className="courier-banner-right">立即下单 <Text className="arrow">{'>'}</Text></View>
      </Navigator>

      <View className="main-content">
        <ScrollView className="sidebar" scrollY>
          {displayCategories.map((category) => (
            <View
              key={category.id}
              className={`category-item ${activeCategoryId === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategoryId(category.id)}
            >
              {category.name}
            </View>
          ))}
        </ScrollView>

        <ScrollView className="product-list" scrollY>
          {displayProducts.length > 0 ? (
            displayProducts.map((product: any) => (
              <View className="product-item" key={product.id} onClick={() => handleGoDetail(product.id)}>
                <Image className="product-img" src={product.cover_image || product.imageUrl} mode="aspectFill" />
                <View className="product-info">
                  <View>
                    <View className="name">{product.title || product.name}</View>
                    <View className="desc">{product.subtitle || product.desc}</View>
                    <View className="tags">
                      {product.tags && product.tags.map((tag: string, index: number) => (
                        <Text key={index} className="tag">{tag}</Text>
                      ))}
                      {product.salesTag && (
                        <Text className="sales-tag">{product.salesTag}</Text>
                      )}
                    </View>
                  </View>
                  <View className="price-row">
                    <View>
                      <Text className="price"><Text className="symbol">¥</Text>{((product.price || 0) / 100).toFixed(2)}</Text>
                      {product.original_price && (
                        <Text className="original-price">¥{((product.original_price || 0) / 100).toFixed(2)}</Text>
                      )}
                    </View>
                    <View className="add-cart-btn" onClick={(e) => handleAddCart(e, product)}>
                      +
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="empty-state">{loading ? '加载中...' : '该分类下暂无商品~'}</View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}
