import React, { useState } from 'react'
import { View, Text, Image, ScrollView, Input } from '@tarojs/components'
import { mockCategories, Product } from '../../mock/data'
import { useCart } from '../../store/CartContext'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Category() {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(mockCategories[0].id)
  const { addItem } = useCart()

  const activeCategory = mockCategories.find((c) => c.id === activeCategoryId)
  const products = activeCategory?.products || []

  const handleAddCart = (e: any, product: Product) => {
    e.stopPropagation();
    addItem(product);
    Taro.showToast({
      title: '已加入购物车',
      icon: 'success',
      duration: 1000,
    });
  }

  return (
    <View className="category-page">
      <View className="search-bar">
        <Input className="search-input" placeholder="解腻水饮料好喝无腹忧" />
      </View>

      <View className="main-content">
        <ScrollView className="sidebar" scrollY>
          {mockCategories.map((category) => (
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
          <View className="product-list-inner">
            {products.length > 0 ? (
              products.map((product) => (
                <View className="product-item" key={product.id}>
                  <Image className="product-img" src={product.imageUrl} mode="aspectFill" />
                  <View className="product-info">
                    <View>
                      <View className="name">{product.name}</View>
                      <View className="desc">{product.desc}</View>
                      <View className="tags">
                        {product.tags?.map((tag, index) => (
                          <Text key={index} className="tag">{tag}</Text>
                        ))}
                        {product.salesTag && (
                          <Text className="sales-tag">{product.salesTag}</Text>
                        )}
                      </View>
                    </View>
                    <View className="price-row">
                      <View>
                        <Text className="price"><Text className="symbol">¥</Text>{product.price.toFixed(1)}</Text>
                        {product.originalPrice && (
                          <Text className="original-price">¥{product.originalPrice.toFixed(1)}</Text>
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
              <View className="empty-state">该分类下暂无商品~</View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  )
}
