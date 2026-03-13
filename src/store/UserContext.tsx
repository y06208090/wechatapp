import React, { createContext, useContext, useEffect, useState } from 'react'
import Taro from '@tarojs/taro'

import { mockUser } from '../mock/data'

export const DEFAULT_AVATAR_URL =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

export interface UserInfo {
  name: string
  avatar: string
  balance: number
  coupons: number
  isLoggedIn: boolean
  profileCompleted: boolean
  id?: string
  phone?: string
  isMember?: boolean
}

interface BackendUserPayload {
  avatar?: string | null
  nickname?: string | null
  phone?: string | null
  id?: string
  is_member?: boolean
  profile_completed?: boolean
}

interface UserContextType {
  userInfo: UserInfo
  login: (payload: BackendUserPayload) => void
  syncBackendUser: (payload: BackendUserPayload) => void
  completeProfile: (payload: { avatar: string; nickname: string }) => void
  logout: () => void
}

const defaultUser: UserInfo = {
  name: '',
  avatar: '',
  balance: 0,
  coupons: 0,
  isLoggedIn: false,
  profileCompleted: false,
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const buildUserInfo = (
  payload: BackendUserPayload,
  previous?: UserInfo,
): UserInfo => {
  const avatar = payload.avatar?.trim() || previous?.avatar || ''
  const nickname = payload.nickname?.trim() || previous?.name || ''

  return {
    name: nickname,
    avatar,
    balance: previous?.balance ?? mockUser.balance,
    coupons: previous?.coupons ?? mockUser.coupons,
    isLoggedIn: true,
    profileCompleted: payload.profile_completed ?? previous?.profileCompleted ?? false,
    id: payload.id ?? previous?.id,
    phone: payload.phone ?? previous?.phone,
    isMember: payload.is_member ?? previous?.isMember ?? false,
  }
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo>(defaultUser)

  useEffect(() => {
    const savedUser = Taro.getStorageSync('currentUser')
    if (savedUser) {
      setUserInfo(savedUser)
    }
  }, [])

  const persistUser = (nextUserInfo: UserInfo, payload: BackendUserPayload) => {
    setUserInfo(nextUserInfo)
    Taro.setStorageSync('currentUser', nextUserInfo)
    Taro.setStorageSync('backendUser', {
      id: payload.id ?? nextUserInfo.id,
      avatar: payload.avatar ?? nextUserInfo.avatar,
      nickname: payload.nickname ?? nextUserInfo.name,
      phone: payload.phone ?? nextUserInfo.phone,
      is_member: payload.is_member ?? nextUserInfo.isMember,
      profile_completed:
        payload.profile_completed ?? nextUserInfo.profileCompleted,
    })
  }

  const syncBackendUser = (payload: BackendUserPayload) => {
    setUserInfo((previous) => {
      const nextUserInfo = buildUserInfo(payload, previous)
      Taro.setStorageSync('currentUser', nextUserInfo)
      Taro.setStorageSync('backendUser', {
        id: payload.id ?? nextUserInfo.id,
        avatar: payload.avatar ?? nextUserInfo.avatar,
        nickname: payload.nickname ?? nextUserInfo.name,
        phone: payload.phone ?? nextUserInfo.phone,
        is_member: payload.is_member ?? nextUserInfo.isMember,
        profile_completed:
          payload.profile_completed ?? nextUserInfo.profileCompleted,
      })
      return nextUserInfo
    })
  }

  const login = (payload: BackendUserPayload) => {
    const nextUserInfo = buildUserInfo(payload)
    persistUser(nextUserInfo, payload)
  }

  const completeProfile = (payload: { avatar: string; nickname: string }) => {
    const nextUserInfo: UserInfo = {
      ...userInfo,
      name: payload.nickname.trim(),
      avatar: payload.avatar,
      profileCompleted: true,
      isLoggedIn: true,
    }

    setUserInfo(nextUserInfo)
    Taro.setStorageSync('currentUser', nextUserInfo)
    const backendUser = Taro.getStorageSync('backendUser') || {}
    Taro.setStorageSync('backendUser', {
      ...backendUser,
      avatar: payload.avatar,
      nickname: payload.nickname.trim(),
      profile_completed: true,
    })
  }

  const logout = () => {
    setUserInfo(defaultUser)
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('currentUser')
    Taro.removeStorageSync('backendUser')
    Taro.removeStorageSync('needsProfileCompletion')
    Taro.showToast({
      title: '已退出登录',
      icon: 'none',
    })
  }

  return (
    <UserContext.Provider
      value={{ userInfo, login, syncBackendUser, completeProfile, logout }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser 必须在 UserProvider 内使用')
  }
  return context
}
