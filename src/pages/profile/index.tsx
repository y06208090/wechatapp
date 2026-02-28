import React, { useState } from 'react'
import { View, Text, Image, Button, Input } from '@tarojs/components'
import { useUser } from '../../store/UserContext'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Profile() {
  const { userInfo, login, logout } = useUser()
  const [showAuthPopup, setShowAuthPopup] = useState(false)

  // 用于暂存用户由填写组件产出的头像与昵称
  const [tempAvatar, setTempAvatar] = useState(userInfo.avatar)
  const [tempName, setTempName] = useState('')
  const menuList = [
    { title: '我的订单', path: '/pages/order/index' },
    { title: '代取快递订单', path: '/pages/courier-order/index' },
    { title: '会员中心', path: '/pages/member/index' },
    { title: '收货地址', path: '/pages/address/index' },
    { title: '商家入驻', path: '/pages/merchant/index' },
    { title: '联系客服', path: 'contact' }, // 特殊标识
    { title: '设置', path: '/pages/setting/index' },
  ]

  const handleMenuClick = (item: any) => {
    if (item.path === 'contact') return // 客服按钮走原生 button
    Taro.navigateTo({ url: item.path })
  }

  const handleChooseAvatar = (e: any) => {
    // 微信规定 e.detail.avatarUrl 返回选择的临时路径
    if (e.detail.avatarUrl) {
      setTempAvatar(e.detail.avatarUrl)
    }
  }

  const handleInputName = (e: any) => {
    setTempName(e.detail.value)
  }

  const handleConfirmLogin = () => {
    if (!tempName.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    // 调用 Context 中的 login 持久化存储
    login(tempAvatar, tempName)
    setShowAuthPopup(false)
    Taro.showToast({ title: '登录成功', icon: 'success' })
  }

  return (
    <View className={`profile-page ${showAuthPopup ? 'no-scroll' : ''}`}>
      <View className="header-section">
        {userInfo.isLoggedIn ? (
          <>
            <Image className="avatar" src={userInfo.avatar} mode="aspectFill" onClick={() => {
              // 可选：实现登出逻辑或修改个人信息
              Taro.showModal({
                title: '提示',
                content: '需要退出登录吗？',
                success: (res) => { if (res.confirm) logout() }
              })
            }} />
            <View className="user-info">
              <View className="name">{userInfo.name}</View>
              <View className="subtitle">部队小店专属会员</View>
            </View>
          </>
        ) : (
          <>
            <Image
              className="avatar"
              src={userInfo.avatar}
              mode="aspectFill"
              onClick={() => setShowAuthPopup(true)}
            />
            <View className="user-info" onClick={() => setShowAuthPopup(true)}>
              <View className="name">点击登录/注册</View>
              <View className="subtitle">登录享受更多会员特权</View>
            </View>
          </>
        )}
      </View>

      <View className="stats-card">
        <View className="stat-item">
          <View className="value">{userInfo.balance.toFixed(2)}</View>
          <View className="label">余额(元)</View>
        </View>
        <View className="stat-item">
          <View className="value">{userInfo.coupons}</View>
          <View className="label">优惠券</View>
        </View>
        <View className="stat-item">
          <View className="value">0</View>
          <View className="label">积分</View>
        </View>
      </View>

      <View className="menu-list">
        {menuList.map((item, index) => (
          item.path === 'contact' ? (
            <Button className="menu-item contact-btn" openType="contact" key={index}>
              <Text className="menu-name">{item.title}</Text>
              <Text className="arrow">{'>'}</Text>
            </Button>
          ) : (
            <View className="menu-item" key={index} onClick={() => handleMenuClick(item)}>
              <Text className="menu-name">{item.title}</Text>
              <Text className="arrow">{'>'}</Text>
            </View>
          )
        ))}
      </View>

      {/* 授权登录弹出层 */}
      {showAuthPopup && (
        <View className="auth-popup">
          <View className="mask" onClick={() => setShowAuthPopup(false)}></View>
          <View className="popup-content">
            <View className="popup-header">
              <Text className="title">完善个人信息</Text>
              <Text className="subtitle">获取您的头像和昵称以提供更好的体验</Text>
            </View>

            <View className="form-group">
              <View className="form-item avatar-picker-wrapper">
                <Text className="label">头像</Text>
                <Button
                  className="avatar-btn"
                  openType="chooseAvatar"
                  onChooseAvatar={handleChooseAvatar}
                >
                  <Image className="temp-avatar" src={tempAvatar} mode="aspectFill" />
                </Button>
                <Text className="edit-hint">点击重新选择</Text>
              </View>

              <View className="form-item nickname-input-wrapper">
                <Text className="label">昵称</Text>
                <Input
                  className="nickname-input"
                  type="nickname"
                  placeholder="请输入您的微信昵称"
                  value={tempName}
                  onInput={handleInputName}
                />
              </View>
            </View>

            <Button className="confirm-btn" onClick={handleConfirmLogin}>确认登录</Button>
          </View>
        </View>
      )}
    </View>
  )
}
