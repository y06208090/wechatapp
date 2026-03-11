import Taro from '@tarojs/taro';

const BASE_URL = 'http://localhost:8000/api';

export interface HttpResponse<T = any> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export const request = async <T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  contentType: string = 'application/json'
): Promise<T> => {
  const token = Taro.getStorageSync('token');
  const header: any = {
    'content-type': contentType,
  };
  if (token) {
    header['Authorization'] = 'Bearer ' + token;
  }

  try {
    const res = await Taro.request({
      url: BASE_URL + url,
      method,
      data,
      header,
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      const responseData = res.data as HttpResponse<T>;
      if (responseData && responseData.success !== undefined) {
        if (responseData.success) {
          return responseData.data;
        } else {
          throw new Error(responseData.error?.message || '请求失败');
        }
      }
      return res.data as any;
    } else {
      if (res.statusCode === 401) {
        Taro.removeStorageSync('token');
        Taro.navigateTo({ url: '/pages/profile/index' }); // 假设登录在profile页面
      }
      throw new Error('Request failed with status ' + res.statusCode);
    }
  } catch (error: any) {
    console.error('API Request Error:', error);
    Taro.showToast({
      title: error.message || '网络请求错误',
      icon: 'none',
    });
    throw error;
  }
};
