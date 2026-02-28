import React from 'react'
import { View, Text } from '@tarojs/components'
import './index.scss'

export default function Member() {
    return (
        <View className="member-page">
            <View className="vip-card">
                <View className="title">小象黄金会员</View>
                <View className="subtitle">当前成长值: 1850 / 5000</View>
                <View className="progress-bar">
                    <View className="inner" style={{ width: '37%' }}></View>
                </View>
            </View>

            <View className="rights-section">
                <View className="section-title">我的权益</View>
                <View className="rights-grid">
                    <View className="right-item"><Text className="icon">🚚</Text><Text>免邮特权</Text></View>
                    <View className="right-item"><Text className="icon">🎫</Text><Text>专享神券</Text></View>
                    <View className="right-item"><Text className="icon">🎁</Text><Text>生日礼包</Text></View>
                    <View className="right-item"><Text className="icon">⚡</Text><Text>极速退款</Text></View>
                </View>
            </View>
        </View>
    )
}
