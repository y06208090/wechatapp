import React from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import './index.scss'

export default function Merchant() {
    return (
        <View className="merchant-page">
            <View className="header">
                <View className="title">成为小象合作商家</View>
                <View className="subtitle">共享流量红利，轻松卖爆全城</View>
            </View>
            <View className="form">
                <View className="form-item"><Text className="label">商家名称</Text><Input placeholder="请输入店铺名称" /></View>
                <View className="form-item"><Text className="label">主营类目</Text><Input placeholder="例如：生鲜、零食、日用" /></View>
                <View className="form-item"><Text className="label">联系人</Text><Input placeholder="您的称呼" /></View>
                <View className="form-item"><Text className="label">联系电话</Text><Input placeholder="手机号码" type="number" maxlength={11} /></View>
                <Button className="submit-btn">提交入驻申请</Button>
            </View>
        </View>
    )
}
