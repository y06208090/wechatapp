import React, { createContext, useContext, useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { mockUser } from '../mock/data'

export interface UserInfo {
    name: string;
    avatar: string;
    balance: number;
    coupons: number;
    isLoggedIn: boolean;
    id?: string;
    phone?: string;
    isMember?: boolean;
}

interface UserContextType {
    userInfo: UserInfo;
    login: (payload: {
        avatar?: string | null;
        nickname?: string | null;
        phone?: string | null;
        id?: string;
        is_member?: boolean;
    }) => void;
    logout: () => void;
}

const defaultUser: UserInfo = {
    name: "未登录",
    avatar: "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0", // 微信默认灰底小人
    balance: 0,
    coupons: 0,
    isLoggedIn: false,
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userInfo, setUserInfo] = useState<UserInfo>(defaultUser)

    // 初始化时从本地存储读取
    useEffect(() => {
        const savedUser = Taro.getStorageSync('currentUser')
        if (savedUser) {
            setUserInfo(savedUser)
        }
    }, [])

    const login = (payload: {
        avatar?: string | null;
        nickname?: string | null;
        phone?: string | null;
        id?: string;
        is_member?: boolean;
    }) => {
        const newUserInfo = {
            ...userInfo,
            name: payload.nickname || '微信用户',
            avatar: payload.avatar || defaultUser.avatar,
            balance: mockUser.balance, // 模拟读取真实账户数据
            coupons: mockUser.coupons,
            isLoggedIn: true,
            id: payload.id,
            phone: payload.phone || undefined,
            isMember: payload.is_member ?? false,
        }
        setUserInfo(newUserInfo)
        Taro.setStorageSync('currentUser', newUserInfo)
    }

    const logout = () => {
        setUserInfo(defaultUser)
        Taro.removeStorageSync('token')
        Taro.removeStorageSync('currentUser')
        Taro.removeStorageSync('backendUser')
        Taro.showToast({
            title: '已退出登录',
            icon: 'none'
        })
    }

    return (
        <UserContext.Provider value={{ userInfo, login, logout }}>
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
