import React, { createContext, useContext, useEffect, useState } from 'react'
import Taro from '@tarojs/taro'

import { mockUser } from '../mock/data'
import { clearAuthStorage } from '../utils/request'

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
  const avatar = (typeof payload.avatar === 'string' ? payload.avatar.trim() : '') || (previous ? previous.avatar : '') || ''
  const nickname = (typeof payload.nickname === 'string' ? payload.nickname.trim() : '') || (previous ? previous.name : '') || ''
  const previousBalance = previous ? previous.balance : undefined
  const previousCoupons = previous ? previous.coupons : undefined
  const previousProfileCompleted = previous ? previous.profileCompleted : undefined
  const previousId = previous ? previous.id : undefined
  const previousPhone = previous ? previous.phone : undefined
  const previousIsMember = previous ? previous.isMember : undefined

  return {
    name: nickname,
    avatar,
    balance: previousBalance !== undefined && previousBalance !== null ? previousBalance : mockUser.balance,
    coupons: previousCoupons !== undefined && previousCoupons !== null ? previousCoupons : mockUser.coupons,
    isLoggedIn: true,
    profileCompleted:
      payload.profile_completed !== undefined && payload.profile_completed !== null
        ? payload.profile_completed
        : (previousProfileCompleted !== undefined && previousProfileCompleted !== null ? previousProfileCompleted : false),
    id: payload.id !== undefined && payload.id !== null ? payload.id : previousId,
    phone: payload.phone !== undefined && payload.phone !== null ? payload.phone : previousPhone,
    isMember:
      payload.is_member !== undefined && payload.is_member !== null
        ? payload.is_member
        : (previousIsMember !== undefined && previousIsMember !== null ? previousIsMember : false),
  }
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo>(defaultUser)

  useEffect(() => {
    const token = Taro.getStorageSync('token')
    const savedUser = Taro.getStorageSync('currentUser')
    if (!token) {
      clearAuthStorage()
      return
    }
    if (savedUser) {
      setUserInfo(savedUser)
    }
  }, [])

  const persistUser = (nextUserInfo: UserInfo, payload: BackendUserPayload) => {
    setUserInfo(nextUserInfo)
    Taro.setStorageSync('currentUser', nextUserInfo)
    Taro.setStorageSync('backendUser', {
      id: payload.id !== undefined && payload.id !== null ? payload.id : nextUserInfo.id,
      avatar: payload.avatar !== undefined && payload.avatar !== null ? payload.avatar : nextUserInfo.avatar,
      nickname: payload.nickname !== undefined && payload.nickname !== null ? payload.nickname : nextUserInfo.name,
      phone: payload.phone !== undefined && payload.phone !== null ? payload.phone : nextUserInfo.phone,
      is_member: payload.is_member !== undefined && payload.is_member !== null ? payload.is_member : nextUserInfo.isMember,
      profile_completed:
        payload.profile_completed !== undefined && payload.profile_completed !== null
          ? payload.profile_completed
          : nextUserInfo.profileCompleted,
    })
  }

  const syncBackendUser = (payload: BackendUserPayload) => {
    setUserInfo((previous) => {
      const nextUserInfo = buildUserInfo(payload, previous)
      Taro.setStorageSync('currentUser', nextUserInfo)
      Taro.setStorageSync('backendUser', {
        id: payload.id !== undefined && payload.id !== null ? payload.id : nextUserInfo.id,
        avatar: payload.avatar !== undefined && payload.avatar !== null ? payload.avatar : nextUserInfo.avatar,
        nickname: payload.nickname !== undefined && payload.nickname !== null ? payload.nickname : nextUserInfo.name,
        phone: payload.phone !== undefined && payload.phone !== null ? payload.phone : nextUserInfo.phone,
        is_member: payload.is_member !== undefined && payload.is_member !== null ? payload.is_member : nextUserInfo.isMember,
        profile_completed:
          payload.profile_completed !== undefined && payload.profile_completed !== null
            ? payload.profile_completed
            : nextUserInfo.profileCompleted,
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
    clearAuthStorage()
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
