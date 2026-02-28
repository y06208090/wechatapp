import React, { createContext, useContext, useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { mockUser } from '../mock/data'

export interface UserInfo {
    name: string;
    avatar: string;
    balance: number;
    coupons: number;
    isLoggedIn: boolean;
}

interface UserContextType {
    userInfo: UserInfo;
    login: (avatar: string, name: string) => void;
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

    const login = (avatarUrl: string, name: string) => {
        const newUserInfo = {
            ...userInfo,
            name: name,
            avatar: avatarUrl,
            balance: mockUser.balance, // 模拟读取真实账户数据
            coupons: mockUser.coupons,
            isLoggedIn: true,
        }
        setUserInfo(newUserInfo)
        Taro.setStorageSync('currentUser', newUserInfo)
    }

    const logout = () => {
        setUserInfo(defaultUser)
        Taro.removeStorageSync('currentUser')
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
