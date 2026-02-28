import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import { useUser } from '../../store/UserContext'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Setting() {
    const { userInfo, logout } = useUser()

    const handleClearCache = () => {
        Taro.showLoading({ title: '清理中...' })
        setTimeout(() => {
            Taro.hideLoading()
            Taro.showToast({ title: '清理完成', icon: 'success' })
        }, 1000)
    }

    const handleLogout = () => {
        Taro.showModal({
            title: '提示',
            content: '确认退出当前账号吗？',
            success: (res) => {
                if (res.confirm) {
                    logout()
                    Taro.navigateBack()
                }
            }
        })
    }

    return (
        <View className="setting-page">
            <View className="setting-group">
                <View className="setting-item">
                    <Text className="title">账户与安全</Text>
                    <Text className="arrow">{'>'}</Text>
                </View>
                <View className="setting-item">
                    <Text className="title">支付设置</Text>
                    <Text className="arrow">{'>'}</Text>
                </View>
            </View>

            <View className="setting-group">
                <View className="setting-item" onClick={handleClearCache}>
                    <Text className="title">清除缓存</Text>
                    <Text className="desc">12.5MB</Text>
                </View>
                <View className="setting-item">
                    <Text className="title">关于小象超市</Text>
                    <Text className="desc">v1.0.0</Text>
                </View>
            </View>

            {userInfo.isLoggedIn && (
                <Button className="logout-btn" onClick={handleLogout}>退出登录</Button>
            )}
        </View>
    )
}
