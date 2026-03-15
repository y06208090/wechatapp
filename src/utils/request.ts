import Taro from '@tarojs/taro';

export const API_BASE_URL = __API_BASE_URL__;
export const ASSET_BASE_URL = __API_ORIGIN__;

export const clearAuthStorage = () => {
  Taro.removeStorageSync('token');
  Taro.removeStorageSync('currentUser');
  Taro.removeStorageSync('backendUser');
  Taro.removeStorageSync('needsProfileCompletion');
};

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
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  data?: any,
  contentType: string = 'application/json'
): Promise<T> => {
  const requestUrl = `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
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
          throw new Error(
            responseData.error && responseData.error.message
              ? responseData.error.message
              : '请求失败'
          );
        }
      }
      return res.data as any;
    } else {
      if (res.statusCode === 401) {
        clearAuthStorage();
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

export const buildAssetUrl = (path?: string | null) => {
  if (!path) {
    return '';
  }
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  return `${ASSET_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
