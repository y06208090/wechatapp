import { useEffect, useState } from 'react'
import { View, Text, Input, Textarea, Switch } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'

import { create_address, delete_address, get_address, update_address } from '../../api'
import { normalizeAddress } from '../../utils/address'

import './index.scss'

interface AddressFormState {
  name: string;
  phone: string;
  detail: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

const EMPTY_FORM: AddressFormState = {
  name: '',
  phone: '',
  detail: '',
  lat: undefined,
  lng: undefined,
  isDefault: false,
}

export default function AddressEdit() {
  const router = useRouter()
  const id = router.params.id
  const isEdit = !!id
  const [form, setForm] = useState<AddressFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: isEdit ? '编辑地址' : '新增地址' })
  }, [isEdit])

  useEffect(() => {
    if (!id) {
      return
    }
    void fetchAddress(id)
  }, [id])

  const updateField = <K extends keyof AddressFormState>(key: K, value: AddressFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const fetchAddress = async (addressId: string) => {
    try {
      const res = await get_address(addressId)
      const normalized = normalizeAddress(res)
      setForm({
        name: normalized.name,
        phone: normalized.phone,
        detail: normalized.detail,
        lat: normalized.lat,
        lng: normalized.lng,
        isDefault: normalized.isDefault,
      })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '获取地址详情失败', icon: 'none' })
    }
  }

  const validateForm = () => {
    if (!form.name.trim()) {
      return '请填写收货人姓名'
    }
    if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) {
      return '请填写正确的手机号'
    }
    if (!form.detail.trim()) {
      return '请填写详细地址'
    }
    return ''
  }

  const handleChooseLocation = async () => {
    try {
      const location = await Taro.chooseLocation({})
      const detail = [location.address, location.name].filter(Boolean).join(' ').trim()
      setForm((prev) => ({
        ...prev,
        detail: detail || prev.detail,
        lat: location.latitude,
        lng: location.longitude,
      }))
    } catch (error: any) {
      if (error && error.errMsg && error.errMsg.indexOf('cancel') !== -1) {
        return
      }
      const errorMessage =
        error && (error.errMsg || error.message) ? error.errMsg || error.message : '选择位置失败'
      console.error('[address-edit] chooseLocation failed', error)
      Taro.showToast({ title: errorMessage, icon: 'none' })
    }
  }

  const handleSubmit = async () => {
    const validationMessage = validateForm()
    if (validationMessage) {
      Taro.showToast({ title: validationMessage, icon: 'none' })
      return
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      detail: form.detail.trim(),
      lat: form.lat,
      lng: form.lng,
      is_default: form.isDefault,
    }

    setSaving(true)
    try {
      if (id) {
        await update_address(id, payload)
      } else {
        await create_address(payload)
      }
      Taro.showToast({ title: id ? '地址已更新' : '地址已新增', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 500)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '保存地址失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) {
      return
    }
    const modal = await Taro.showModal({
      title: '删除地址',
      content: '确认删除这个收货地址吗？',
    })
    if (!modal.confirm) {
      return
    }
    try {
      await delete_address(id)
      Taro.showToast({ title: '地址已删除', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 500)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '删除地址失败', icon: 'none' })
    }
  }

  return (
    <View className="address-edit-page">
      <View className="form-card">
        <View className="field">
          <Text className="field__label">收货人</Text>
          <Input
            className="field__input"
            value={form.name}
            maxlength={20}
            placeholder="请输入收货人姓名"
            onInput={(event) => updateField('name', event.detail.value)}
          />
        </View>

        <View className="field">
          <Text className="field__label">手机号</Text>
          <Input
            className="field__input"
            type="number"
            maxlength={11}
            value={form.phone}
            placeholder="请输入收货人手机号"
            onInput={(event) => updateField('phone', event.detail.value)}
          />
        </View>

        <View className="field">
          <Text className="field__label">详细地址</Text>
          <Textarea
            className="field__textarea"
            value={form.detail}
            maxlength={120}
            placeholder="请输入小区、楼栋、门牌等信息"
            onInput={(event) => updateField('detail', event.detail.value)}
          />
          <View className="location-action" onClick={handleChooseLocation}>
            从地图选择位置
          </View>
          <Text className="field__hint">
            {typeof form.lat === 'number' && typeof form.lng === 'number'
              ? `已记录坐标：${form.lat.toFixed(6)}, ${form.lng.toFixed(6)}`
              : '可选。选择位置后可自动带入坐标，便于配送距离计算。'}
          </Text>
        </View>

        <View className="field field--switch">
          <Text className="field__label">设为默认地址</Text>
          <Switch
            color="#00B26A"
            checked={form.isDefault}
            onChange={(event) => updateField('isDefault', event.detail.value)}
          />
        </View>
      </View>

      <View className="submit-bar">
        {isEdit ? (
          <View className="delete-btn" onClick={() => void handleDelete()}>
            删除
          </View>
        ) : null}
        <View className="submit-btn" onClick={() => void handleSubmit()}>
          {saving ? '保存中...' : isEdit ? '保存修改' : '保存地址'}
        </View>
      </View>
    </View>
  )
}
