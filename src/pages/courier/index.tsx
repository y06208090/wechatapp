import React, { useState } from 'react'
import { View, Text, Input, Textarea, Button, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Courier() {
    const [formData, setFormData] = useState({
        company: '',
        pickupCode: '',
        receiverName: '',
        phone: '',
        address: '',
        remark: ''
    })

    // 模拟一些快递公司选项
    const companies = ['顺丰速运', '中通快递', '圆通速递', '申通快递', '韵达速递', '京东物流', '极兔速递', '邮政EMS', '其他']

    const handleCompanyChange = (e: any) => {
        setFormData({ ...formData, company: companies[e.detail.value] })
    }

    const handleChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value })
    }

    const handleSubmit = () => {
        if (!formData.company || !formData.pickupCode || !formData.receiverName || !formData.phone || !formData.address) {
            Taro.showToast({
                title: '请填写必填项',
                icon: 'none'
            })
            return
        }

        // 正则简单校验手机号 (仅作演示)
        if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
            Taro.showToast({
                title: '手机号格式不正确',
                icon: 'none'
            })
            return
        }

        Taro.showLoading({ title: '提交中...' })
        setTimeout(() => {
            Taro.hideLoading()
            Taro.showToast({
                title: '代取订单已提交',
                icon: 'success',
                duration: 2000
            })
            setTimeout(() => {
                Taro.navigateBack()
            }, 2000)
        }, 1500)
    }

    return (
        <View className="courier-page">
            <View className="header-banner">
                <Text className="title">您的快递，我们来跑腿</Text>
                <Text className="subtitle">安全快捷 · 准时送达</Text>
            </View>

            <View className="form-container">
                <View className="form-item picker-item">
                    <Text className="label"><Text className="required">*</Text>快递公司</Text>
                    <Picker mode="selector" range={companies} onChange={handleCompanyChange}>
                        <View className={`picker-value ${!formData.company ? 'placeholder' : ''}`}>
                            {formData.company || '请选择快递公司'}
                        </View>
                    </Picker>
                </View>

                <View className="form-item">
                    <Text className="label"><Text className="required">*</Text>取件码</Text>
                    <Input
                        className="input"
                        placeholder="例如：12-3-4567 或者 货架号"
                        value={formData.pickupCode}
                        onInput={(e) => handleChange('pickupCode', e.detail.value)}
                    />
                </View>

                <View className="form-item">
                    <Text className="label"><Text className="required">*</Text>送达地址</Text>
                    <Input
                        className="input"
                        placeholder="宿舍楼/小区详细地址"
                        value={formData.address}
                        onInput={(e) => handleChange('address', e.detail.value)}
                    />
                </View>

                <View className="form-item">
                    <Text className="label"><Text className="required">*</Text>收件人姓名</Text>
                    <Input
                        className="input"
                        placeholder="请填写收件人姓名"
                        value={formData.receiverName}
                        onInput={(e) => handleChange('receiverName', e.detail.value)}
                    />
                </View>

                <View className="form-item">
                    <Text className="label"><Text className="required">*</Text>联系电话</Text>
                    <Input
                        className="input"
                        type="number"
                        placeholder="请填写手机号码"
                        maxlength={11}
                        value={formData.phone}
                        onInput={(e) => handleChange('phone', e.detail.value)}
                    />
                </View>

                <View className="form-item textarea-item">
                    <Text className="label">备注信息 (选填)</Text>
                    <Textarea
                        className="textarea"
                        placeholder="例如：易碎物品请轻拿轻放、请下午5点后派送..."
                        value={formData.remark}
                        onInput={(e) => handleChange('remark', e.detail.value)}
                        maxlength={100}
                    />
                </View>
            </View>

            <View className="submit-bar">
                <View className="price-info">
                    <Text className="label">跑腿服务费：</Text>
                    <Text className="price">¥2.00</Text>
                </View>
                <Button className="submit-btn" onClick={handleSubmit}>确认下单</Button>
            </View>
        </View>
    )
}
