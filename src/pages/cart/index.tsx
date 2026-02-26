import React from 'react'
import { View, Text, Image, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useCart } from '../../store/CartContext'
import './index.scss'

export default function Cart() {
  const {
    items,
    updateQuantity,
    toggleSelect,
    toggleSelectAll,
    totalPrice,
    isAllSelected,
  } = useCart()

  const handleCheckout = () => {
    if (totalPrice === 0) return;
    Taro.showToast({
      title: '结算成功 (Mock)',
      icon: 'success',
      duration: 1500,
    });
  }

  const goShopping = () => {
    Taro.switchTab({
      url: '/pages/category/index'
    })
  }

  if (items.length === 0) {
    return (
      <View className="cart-page">
        <View className="empty-cart">
          <Image 
            className="empty-icon" 
            src="https://img12.360buyimg.com/img/s240x240_jfs/t1/181467/20/19052/15392/611a133fEbb8119eb/b2ab91fe9da248fd.png" 
          />
          <Text className="empty-text">您的购物车还空着呢~快去逛逛吧</Text>
          <View className="go-shopping-btn" onClick={goShopping}>去逛逛</View>
        </View>
      </View>
    )
  }

  return (
    <View className="cart-page">
      <ScrollView className="cart-list" scrollY>
        <View className="cart-list-inner">
          {items.map((item) => (
            <View className="cart-item" key={item.id}>
              <View 
                className={`checkbox ${item.selected ? 'checked' : ''}`}
                onClick={() => toggleSelect(item.id)}
              ></View>
              <Image className="item-img" src={item.imageUrl} mode="aspectFill" />
              <View className="item-info">
                <View className="name">{item.name}</View>
                <View className="bottom-row">
                  <Text className="price">¥{item.price.toFixed(1)}</Text>
                  <View className="quantity-control">
                    <View className="btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</View>
                    <Text className="num">{item.quantity}</Text>
                    <View className="btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="bottom-bar">
        <View className="select-all" onClick={toggleSelectAll}>
          <View className={`checkbox ${isAllSelected ? 'checked' : ''}`}></View>
          <Text className="text">全选</Text>
        </View>
        <View className="right-action">
          <View className="total-info">
            <Text className="label">合计: </Text>
            <Text className="price">¥{totalPrice.toFixed(2)}</Text>
          </View>
          <View 
            className={`checkout-btn ${totalPrice > 0 ? 'active' : ''}`}
            onClick={handleCheckout}
          >
            结算
          </View>
        </View>
      </View>
    </View>
  )
}
