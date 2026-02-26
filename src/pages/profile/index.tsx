import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import { mockUser } from '../../mock/data'
import './index.scss'

export default function Profile() {
  const menuList = [
    { title: '我的订单', icon: '' },
    { title: '会员中心', icon: '' },
    { title: '收货地址', icon: '' },
    { title: '商家入驻', icon: '' },
    { title: '联系客服', icon: '' },
    { title: '设置', icon: '' },
  ]

  return (
    <View className="profile-page">
      <View className="header-section">
        <Image className="avatar" src={mockUser.avatar} mode="aspectFill" />
        <View className="user-info">
          <View className="name">{mockUser.name}</View>
          <View className="subtitle">部队小店专属会员</View>
        </View>
      </View>

      <View className="stats-card">
        <View className="stat-item">
          <View className="value">{mockUser.balance.toFixed(2)}</View>
          <View className="label">余额(元)</View>
        </View>
        <View className="stat-item">
          <View className="value">{mockUser.coupons}</View>
          <View className="label">优惠券</View>
        </View>
        <View className="stat-item">
          <View className="value">0</View>
          <View className="label">积分</View>
        </View>
      </View>

      <View className="menu-list">
        {menuList.map((item, index) => (
          <View className="menu-item" key={index}>
            <Text className="menu-name">{item.title}</Text>
            <Text className="arrow">{'>'}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
