import { useState } from 'react'
import { View, Text, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUser } from '../../store/UserContext'
import { wechat_login, phone_sms_login, send_sms_code } from '../../api'
import './index.scss'

interface AuthUser {
    id: string;
    avatar?: string | null;
    nickname?: string | null;
    phone?: string | null;
    is_member?: boolean;
}

interface AuthResponse {
    token: string;
    user: AuthUser;
    profile_completed: boolean;
}

export default function Login() {
    const { login } = useUser()
    const [loginType, setLoginType] = useState<'wechat' | 'phone'>('wechat')
    const [phone, setPhone] = useState('')
    const [code, setCode] = useState('')
    const [countdown, setCountdown] = useState(0)

    const finishLogin = (res: AuthResponse, fallbackName: string) => {
        Taro.setStorageSync('token', res.token)
        Taro.setStorageSync('backendUser', res.user)
        login({
            id: res.user.id,
            avatar: res.user.avatar,
            nickname:
                res.user.nickname || (res.profile_completed ? fallbackName : undefined),
            phone: res.user.phone,
            is_member: res.user.is_member,
            profile_completed: res.profile_completed,
        })
        Taro.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
            if (!res.profile_completed) {
                Taro.setStorageSync('needsProfileCompletion', true)
                Taro.switchTab({ url: '/pages/profile/index' })
                return
            }

            Taro.removeStorageSync('needsProfileCompletion')
            Taro.navigateBack({
                fail: () => Taro.switchTab({ url: '/pages/profile/index' })
            })
        }, 1500)
    }

    const getWechatCode = async () => {
        const { code } = await Taro.login()
        if (!code) {
            throw new Error('未获取到微信登录凭证')
        }
        return code
    }

    const getErrorMessage = (error: any, fallback: string) => {
        if (error && typeof error.message === 'string' && error.message.trim()) {
            return error.message.trim()
        }
        if (error && typeof error.errMsg === 'string' && error.errMsg.trim()) {
            return error.errMsg.trim()
        }
        return fallback
    }

    const reportLoginError = async (stage: string, error: any, fallback: string) => {
        const message = getErrorMessage(error, fallback)
        const toastTitle = `${stage}:${message}`.slice(0, 20)
        console.error(`[login-error][${stage}]`, error)
        Taro.hideLoading()
        Taro.showToast({ title: toastTitle, icon: 'none', duration: 2500 })
        await Taro.showModal({
            title: `${stage}失败`,
            content: message,
            showCancel: false,
            confirmText: '知道了',
        })
    }

    const handleWechatLogin = async () => {
        Taro.showLoading({ title: '登录中...' })
        try {
            let wxCode = ''
            try {
                wxCode = await getWechatCode()
                console.info('[wechat-login] wx.login succeeded', {
                    codePreview: `${wxCode.slice(0, 4)}***${wxCode.slice(-4)}`
                })
            } catch (error: any) {
                await reportLoginError('微信凭证', error, '获取微信登录凭证失败')
                return
            }

            const res = await wechat_login({
                code: wxCode,
            })

            if (!res || !res.token || !res.user) {
                throw new Error('登录接口未返回有效用户信息')
            }

            console.info('[wechat-login] backend login succeeded', {
                userId: res.user.id,
                profileCompleted: res.profile_completed,
            })
            finishLogin(res, '微信用户')
        } catch (e: any) {
            await reportLoginError('后端登录', e, '微信登录失败')
        } finally {
            Taro.hideLoading()
        }
    }

    const handleSendCode = async () => {
        if (!phone || !/^1\d{10}$/.test(phone)) {
            return Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
        }
        try {
            Taro.showLoading({ title: '发送中...' })
            await send_sms_code({ phone })
            Taro.showToast({ title: '验证码已发送', icon: 'success' })
            setCountdown(60)
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } catch (e: any) {
            Taro.showToast({ title: e.message || '发送失败', icon: 'none' })
        } finally {
            Taro.hideLoading()
        }
    }

    const handlePhoneLogin = async () => {
        if (!phone || !code) {
            return Taro.showToast({ title: '请输入手机号和验证码', icon: 'none' })
        }
        try {
            Taro.showLoading({ title: '登录中...' })
            const wechatCode = await getWechatCode()
            const res = await phone_sms_login({
                phone,
                sms_code: code,
                wechat_code: wechatCode,
            })
            if (!res || !res.token || !res.user) {
                throw new Error('登录接口未返回有效用户信息')
            }
            finishLogin(res, '手机用户')
        } catch (e: any) {
            await reportLoginError('手机登录', e, '登录失败')
        } finally {
            Taro.hideLoading()
        }
    }

    return (
        <View className='login-page'>
            <View className='header'>
                <View className='title'>
                    <View className='title-main'>欢迎使用</View>
                    <View className='brand-text'>小象超市</View>
                </View>
                <View className='subtitle'>生活所需，一触即达</View>
            </View>

            <View className='login-box'>
                <View className='tabs'>
                    <View
                        key='tab-wechat'
                        className={`tab ${loginType === 'wechat' ? 'active' : ''}`}
                        onClick={() => setLoginType('wechat')}
                    >
                        <Text>微信登录</Text>
                        <View className={`tab-underline ${loginType === 'wechat' ? 'active-line' : ''}`}></View>
                    </View>
                    <View
                        key='tab-phone'
                        className={`tab ${loginType === 'phone' ? 'active' : ''}`}
                        onClick={() => setLoginType('phone')}
                    >
                        <Text>验证码登录</Text>
                        <View className={`tab-underline ${loginType === 'phone' ? 'active-line' : ''}`}></View>
                    </View>
                </View>

                {loginType === 'wechat' ? (
                    <View key='wechat-panel' className='wechat-login'>
                        <Button className='btn-wechat' onClick={handleWechatLogin}>
                            微信一键登录
                        </Button>
                        <View className='tip-box'>
                            <Text className='tip'>登录即代表您已阅读并同意</Text>
                            <Text className='tip'>《用户协议》与《隐私政策》</Text>
                        </View>
                    </View>
                ) : (
                    <View key='phone-panel' className='phone-login'>
                        <View className='input-group'>
                            <Input
                                className='input'
                                type='number'
                                placeholder='请输入手机号'
                                placeholderStyle='color: #ccc'
                                maxlength={11}
                                value={phone}
                                onInput={(e) => setPhone(e.detail.value)}
                            />
                        </View>
                        <View className='input-group code-group'>
                            <Input
                                className='input'
                                type='number'
                                placeholder='请输入验证码'
                                placeholderStyle='color: #ccc'
                                maxlength={6}
                                value={code}
                                onInput={(e) => setCode(e.detail.value)}
                            />
                            <View
                                className={`btn-code ${countdown > 0 ? 'disabled' : ''}`}
                                onClick={countdown > 0 ? undefined : handleSendCode}
                            >
                                {countdown > 0 ? `${countdown}s` : '获取验证码'}
                            </View>
                        </View>
                        <Button className='btn-submit' onClick={handlePhoneLogin}>
                            立即登录
                        </Button>
                    </View>
                )}
            </View>

            <View className='footer-agreement'>
                登录表示同意 <Text className='link'>用户协议</Text> 和 <Text className='link'>隐私政策</Text>
            </View>
        </View>
    )
}
