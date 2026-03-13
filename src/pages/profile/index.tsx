import { useEffect, useMemo, useState } from 'react'
import { Button, Image, Input, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'

import { get_me, update_me_profile } from '../../api'
import {
  API_BASE_URL,
  buildAssetUrl,
} from '../../utils/request'
import {
  DEFAULT_AVATAR_URL,
  useUser,
} from '../../store/UserContext'

import './index.scss'

export default function Profile() {
  const { userInfo, logout, syncBackendUser, completeProfile } = useUser()
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [showAvatarSheet, setShowAvatarSheet] = useState(false)
  const [draftNickname, setDraftNickname] = useState('')
  const [draftAvatar, setDraftAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const displayAvatar = useMemo(
    () => userInfo.avatar || DEFAULT_AVATAR_URL,
    [userInfo.avatar],
  )

  const menuList = [
    { title: '我的订单', path: '/pages/order/index' },
    { title: '代取快递订单', path: '/pages/courier-order/index' },
    { title: '会员中心', path: '/pages/member/index' },
    { title: '收货地址', path: '/pages/address/index' },
    { title: '商家入驻', path: '/pages/merchant/index' },
    { title: '联系客服', path: 'contact' },
    { title: '设置', path: '/pages/setting/index' },
  ]

  const seedDraftFromUser = () => {
    setDraftNickname(userInfo.name || '')
    setDraftAvatar(userInfo.avatar || '')
  }

  const ensureProfileCompletionState = async () => {
    if (!userInfo.isLoggedIn) {
      setShowProfilePopup(false)
      return
    }

    try {
      const me = await get_me()
      syncBackendUser({
        id: me.id,
        avatar: me.avatar,
        nickname: me.nickname,
        phone: me.phone,
        is_member: me.is_member,
        profile_completed: me.profile_completed,
      })

      if (!me.profile_completed || Taro.getStorageSync('needsProfileCompletion')) {
        setDraftNickname(me.nickname || '')
        setDraftAvatar(buildAssetUrl(me.avatar))
        setShowProfilePopup(true)
      } else {
        setShowProfilePopup(false)
        Taro.removeStorageSync('needsProfileCompletion')
      }
    } catch (error) {
      console.error('Failed to refresh current profile', error)
    }
  }

  useDidShow(() => {
    void ensureProfileCompletionState()
  })

  useEffect(() => {
    if (userInfo.isLoggedIn && !userInfo.profileCompleted) {
      seedDraftFromUser()
      setShowProfilePopup(true)
    }
  }, [userInfo.isLoggedIn, userInfo.profileCompleted])

  const handleLoginClick = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const handleMenuClick = (item: { path: string }) => {
    if (item.path === 'contact') return
    Taro.navigateTo({ url: item.path })
  }

  const handleChooseAvatarFile = async (filePath: string) => {
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    setUploadingAvatar(true)
    try {
      const uploadRes = await Taro.uploadFile({
        url: `${API_BASE_URL}/me/avatar`,
        filePath,
        name: 'file',
        header: {
          Authorization: `Bearer ${token}`,
        },
      })

      const body =
        typeof uploadRes.data === 'string'
          ? JSON.parse(uploadRes.data)
          : uploadRes.data
      if (!body?.success) {
        throw new Error(body?.error?.message || '头像上传失败')
      }

      setDraftAvatar(buildAssetUrl(body.data.url))
      setShowAvatarSheet(false)
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '头像上传失败',
        icon: 'none',
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChooseWechatAvatar = async (event: any) => {
    const avatarUrl = event?.detail?.avatarUrl
    if (!avatarUrl) {
      Taro.showToast({ title: '未获取到微信头像', icon: 'none' })
      return
    }
    await handleChooseAvatarFile(avatarUrl)
  }

  const handleChooseImage = async (
    sourceType: Array<'album' | 'camera'>,
  ) => {
    try {
      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType,
      })
      const filePath = result.tempFilePaths?.[0]
      if (!filePath) {
        return
      }
      await handleChooseAvatarFile(filePath)
    } catch (error) {
      console.error('Choose image cancelled or failed', error)
    }
  }

  const handleSaveProfile = async () => {
    const nickname = draftNickname.trim()
    if (!nickname || !draftAvatar) {
      Taro.showToast({
        title: '请先完善头像和昵称',
        icon: 'none',
      })
      return
    }

    setSaving(true)
    try {
      const profile = await update_me_profile({
        nickname,
        avatar: draftAvatar,
      })
      const avatar = buildAssetUrl(profile.avatar) || draftAvatar
      completeProfile({ avatar, nickname: profile.nickname || nickname })
      Taro.removeStorageSync('needsProfileCompletion')
      setShowProfilePopup(false)
      Taro.showToast({ title: '资料已保存', icon: 'success' })
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '保存失败',
        icon: 'none',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className={`profile-page ${showProfilePopup ? 'popup-open' : ''}`}>
      <View className="header-section">
        {userInfo.isLoggedIn ? (
          <>
            <Image
              className="avatar"
              src={displayAvatar}
              mode="aspectFill"
              onClick={() => {
                Taro.showModal({
                  title: '提示',
                  content: '需要退出登录吗？',
                  success: (res) => {
                    if (res.confirm) logout()
                  },
                })
              }}
            />
            <View className="user-info">
              <View className="name">
                {userInfo.name || '请完善昵称'}
              </View>
              <View className="subtitle">
                {userInfo.profileCompleted
                  ? '部队小店专属会员'
                  : '完善资料后展示专属个人中心'}
              </View>
            </View>
          </>
        ) : (
          <>
            <Image
              className="avatar"
              src={DEFAULT_AVATAR_URL}
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
        {menuList.map((item, index) =>
          item.path === 'contact' ? (
            <Button
              className="menu-item contact-btn"
              openType="contact"
              key={index}
            >
              <Text className="menu-name">{item.title}</Text>
              <Text className="arrow">{'>'}</Text>
            </Button>
          ) : (
            <View
              className="menu-item"
              key={index}
              onClick={() => handleMenuClick(item)}
            >
              <Text className="menu-name">{item.title}</Text>
              <Text className="arrow">{'>'}</Text>
            </View>
          ),
        )}
      </View>

      {showProfilePopup && userInfo.isLoggedIn && (
        <View className="auth-popup">
          <View className="mask" />
          <View className="popup-content">
            <View className="popup-header">
              <Text className="title">补全昵称和头像</Text>
              <Text className="subtitle">
                提供更有辨识度的个人中心展示
              </Text>
            </View>

            <View className="form-group">
              <View
                className="form-item avatar-picker-wrapper"
                onClick={() => setShowAvatarSheet(true)}
              >
                <Text className="label">头像</Text>
                <Image
                  className="temp-avatar-preview"
                  src={draftAvatar || DEFAULT_AVATAR_URL}
                  mode="aspectFill"
                />
                <Text className="edit-hint">
                  {uploadingAvatar ? '上传中...' : '点击选择'}
                </Text>
              </View>

              <View className="form-item nickname-input-wrapper">
                <Text className="label">昵称</Text>
                <Input
                  className="nickname-input"
                  type={'nickname' as any}
                  value={draftNickname}
                  maxlength={20}
                  placeholder="请输入昵称"
                  onInput={(event) => setDraftNickname(event.detail.value)}
                />
              </View>
            </View>

            <Button
              className={`confirm-btn ${
                !draftNickname.trim() || !draftAvatar || saving
                  ? 'disabled'
                  : ''
              }`}
              disabled={!draftNickname.trim() || !draftAvatar || saving}
              loading={saving}
              onClick={handleSaveProfile}
            >
              保存资料
            </Button>
          </View>
        </View>
      )}

      {showAvatarSheet && (
        <View className="sheet-overlay">
          <View className="sheet-mask" onClick={() => setShowAvatarSheet(false)} />
          <View className="avatar-sheet">
            <Button
              className="sheet-action"
              openType="chooseAvatar"
              onChooseAvatar={handleChooseWechatAvatar}
            >
              用微信头像
            </Button>
            <Button
              className="sheet-action"
              onClick={() => void handleChooseImage(['album'])}
            >
              从相册选择
            </Button>
            <Button
              className="sheet-action"
              onClick={() => void handleChooseImage(['camera'])}
            >
              拍照
            </Button>
            <Button
              className="sheet-cancel"
              onClick={() => setShowAvatarSheet(false)}
            >
              取消
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}
