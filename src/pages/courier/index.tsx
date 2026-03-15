import React, { useMemo, useState } from 'react'
import { View, Text, Input, Textarea, Button, Picker, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'

import { create_runner_order, list_addresses, pay_runner_order } from '../../api'
import { AddressRecord, normalizeAddresses } from '../../utils/address'
import { useStore } from '../../store/StoreContext'

import './index.scss'

interface CourierFormState {
  company: string;
  pickupCode: string;
  receiverName: string;
  phone: string;
  address: string;
  remark: string;
}

const companies = ['顺丰速运', '中通快递', '圆通速递', '申通快递', '韵达速递', '京东物流', '极兔速递', '邮政EMS', '其他']

export default function Courier() {
  const { currentStore } = useStore()
  const [formData, setFormData] = useState<CourierFormState>({
    company: '',
    pickupCode: '',
    receiverName: '',
    phone: '',
    address: '',
    remark: '',
  })
  const [addresses, setAddresses] = useState<AddressRecord[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [addressSheetVisible, setAddressSheetVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const selectedAddress = useMemo(
    () => addresses.find((item) => item.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  )
  const hasMultipleAddresses = addresses.length > 1

  useDidShow(() => {
    void fetchAddresses()
  })

  const fetchAddresses = async () => {
    try {
      const result = await list_addresses()
      const items = normalizeAddresses(result)
      setAddresses(items)

      if (items.length === 0) {
        setSelectedAddressId('')
        return
      }

      const defaultAddress = items.find((item) => item.isDefault)
      const nextAddress =
        items.find((item) => item.id === selectedAddressId) || defaultAddress || items[0]

      if (nextAddress) {
        applyAddress(nextAddress)
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '获取地址失败',
        icon: 'none',
      })
    }
  }

  const applyAddress = (address: AddressRecord) => {
    setSelectedAddressId(address.id)
    setFormData((prev) => ({
      ...prev,
      receiverName: address.name,
      phone: address.phone,
      address: address.detail,
    }))
  }

  const handleCompanyChange = (event: any) => {
    setFormData((prev) => ({ ...prev, company: companies[event.detail.value] }))
  }

  const handleChange = (field: keyof CourierFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const goAddressPage = () => {
    Taro.navigateTo({ url: '/pages/address/index' })
  }

  const handleSubmit = async () => {
    if (!currentStore || !currentStore.id) {
      Taro.showToast({
        title: '请先选择门店',
        icon: 'none',
      })
      return
    }

    if (!formData.company || !formData.pickupCode || !formData.receiverName || !formData.phone || !formData.address) {
      Taro.showToast({
        title: '请填写必填项',
        icon: 'none',
      })
      return
    }

    if (!/^1[3-9]\d{9}$/.test(formData.phone.trim())) {
      Taro.showToast({
        title: '手机号格式不正确',
        icon: 'none',
      })
      return
    }

    setSubmitting(true)
    try {
      Taro.showLoading({ title: '提交中...' })
      const created = await create_runner_order({
        store_id: currentStore.id,
        express_company: formData.company,
        pickup_code: formData.pickupCode.trim(),
        delivery_address: formData.address.trim(),
        receiver_name: formData.receiverName.trim(),
        receiver_phone: formData.phone.trim(),
        remark: formData.remark.trim() || undefined,
        distance_km: calcDistanceKm(currentStore, selectedAddress),
      })

      await pay_runner_order({ runner_order_id: created.runner_order_id })
      Taro.showToast({
        title: '代取订单已提交',
        icon: 'success',
        duration: 1600,
      })
      setTimeout(() => {
        Taro.redirectTo({
          url: `/pages/courier-order-detail/index?id=${created.runner_order_id}`,
        })
      }, 800)
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '提交失败',
        icon: 'none',
      })
    } finally {
      setSubmitting(false)
      Taro.hideLoading()
    }
  }

  return (
    <View className="courier-page">
      <View className="header-banner">
        <Text className="title">您的快递，我们来跑腿</Text>
        <Text className="subtitle">自动带入常用地址，切换也更快</Text>
      </View>

      <View className="form-container">
        <View className="address-panel">
          <View className="address-panel__header">
            <Text className="address-panel__title">送达地址</Text>
            {hasMultipleAddresses ? (
              <View className="address-panel__switch" onClick={() => setAddressSheetVisible(true)}>
                切换地址
              </View>
            ) : null}
          </View>

          {selectedAddress ? (
            <View className="address-card">
              <View className="address-card__top">
                <Text className="address-card__name">{selectedAddress.name}</Text>
                <Text className="address-card__phone">{selectedAddress.phone}</Text>
                {selectedAddress.isDefault ? (
                  <Text className="address-card__badge">默认地址</Text>
                ) : null}
              </View>
              <Text className="address-card__detail">{selectedAddress.detail}</Text>
            </View>
          ) : (
            <View className="address-empty" onClick={goAddressPage}>
              <Text className="address-empty__title">还没有配置快递送达地址</Text>
              <Text className="address-empty__action">去新增地址</Text>
            </View>
          )}
        </View>

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
            placeholder="例如：12-3-4567 或货架号"
            value={formData.pickupCode}
            onInput={(event) => handleChange('pickupCode', event.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="label"><Text className="required">*</Text>送达地址</Text>
          <Input
            className="input"
            placeholder="宿舍楼/小区详细地址"
            value={formData.address}
            onInput={(event) => handleChange('address', event.detail.value)}
          />
          <Text className="field-hint">已自动带入已配置地址，也可以手动微调</Text>
        </View>

        <View className="form-item">
          <Text className="label"><Text className="required">*</Text>收件人姓名</Text>
          <Input
            className="input"
            placeholder="请填写收件人姓名"
            value={formData.receiverName}
            onInput={(event) => handleChange('receiverName', event.detail.value)}
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
            onInput={(event) => handleChange('phone', event.detail.value)}
          />
        </View>

        <View className="form-item textarea-item">
          <Text className="label">备注信息（选填）</Text>
          <Textarea
            className="textarea"
            placeholder="例如：晚上 8 点后送达、放门口即可"
            value={formData.remark}
            onInput={(event) => handleChange('remark', event.detail.value)}
            maxlength={100}
          />
        </View>
      </View>

      <View className="submit-bar">
        <View className="price-info">
          <Text className="label">跑腿服务费</Text>
          <Text className="price">¥2.00起</Text>
        </View>
        <Button className="submit-btn" loading={submitting} onClick={handleSubmit}>
          确认下单
        </Button>
      </View>

      {addressSheetVisible ? (
        <View className="address-sheet-mask" onClick={() => setAddressSheetVisible(false)}>
          <View className="address-sheet" onClick={(event) => event.stopPropagation()}>
            <View className="address-sheet__header">
              <Text className="address-sheet__title">选择送达地址</Text>
              <Text className="address-sheet__close" onClick={() => setAddressSheetVisible(false)}>×</Text>
            </View>
            <ScrollView scrollY className="address-sheet__list">
              {addresses.map((address) => (
                <View
                  key={address.id}
                  className={`address-sheet__item ${selectedAddressId === address.id ? 'is-active' : ''}`}
                  onClick={() => {
                    applyAddress(address)
                    setAddressSheetVisible(false)
                  }}
                >
                  <View className="address-sheet__item-top">
                    <Text className="address-sheet__item-name">{address.name}</Text>
                    <Text className="address-sheet__item-phone">{address.phone}</Text>
                    {address.isDefault ? (
                      <Text className="address-sheet__item-badge">默认</Text>
                    ) : null}
                  </View>
                  <Text className="address-sheet__item-detail">{address.detail}</Text>
                </View>
              ))}
            </ScrollView>
            <View className="address-sheet__footer" onClick={goAddressPage}>
              管理地址
            </View>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const calcDistanceKm = (store: any, address: AddressRecord | null) => {
  if (
    !store ||
    !address ||
    typeof store.lat !== 'number' ||
    typeof store.lng !== 'number' ||
    typeof address.lat !== 'number' ||
    typeof address.lng !== 'number'
  ) {
    return undefined
  }

  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(address.lat - store.lat)
  const dLng = toRad(address.lng - store.lng)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(store.lat)) *
      Math.cos(toRad(address.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((earthRadiusKm * c).toFixed(2))
}
