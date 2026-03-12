import Taro from '@tarojs/taro';

const BASE_URL = 'http://ec2-18-166-113-112.ap-east-1.compute.amazonaws.com:3000/api/v1';

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
  const requestUrl = `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
  const token = Taro.getStorageSync('token');
  const header: any = {
    'content-type': contentType,
  };
  if (token) {
    header['Authorization'] = 'Bearer ' + token;
  }

  try {
    const res = await Taro.request({
      url: requestUrl,
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
