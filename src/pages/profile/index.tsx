
import { View, Text, Image, Button } from '@tarojs/components'
import { useUser } from '../../store/UserContext'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Profile() {
  const { userInfo, logout } = useUser()
  const handleLoginClick = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }
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



  return (
    <View className="profile-page">
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
              onClick={handleLoginClick}
            />
            <View className="user-info" onClick={handleLoginClick}>
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


    </View>
  )
}
