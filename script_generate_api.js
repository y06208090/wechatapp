const fs = require('fs');
const path = require('path');

const openapiPath = path.join(__dirname, 'openapi.json');
const apiDirPath = path.join(__dirname, 'src', 'api');
const utilsDirPath = path.join(__dirname, 'src', 'utils');

if (!fs.existsSync(apiDirPath)) fs.mkdirSync(apiDirPath, { recursive: true });
if (!fs.existsSync(utilsDirPath)) fs.mkdirSync(utilsDirPath, { recursive: true });

const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

// 1. Generate request.ts
const requestTsContent = `import Taro from '@tarojs/taro';

const BASE_URL = process.env.TARO_APP_API_URL || 'http://localhost:8000/api';

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
`;

fs.writeFileSync(path.join(utilsDirPath, 'request.ts'), requestTsContent);

// 2. Generate api/index.ts
let apiTsContent = "import { request } from '../utils/request';\n\n";

const typeMap = {
    'integer': 'number',
    'string': 'string',
    'boolean': 'boolean',
    'number': 'number',
    'array': 'any[]',
    'object': 'any'
};

function getTsType(schema) {
    if (!schema) return 'any';
    if (schema.$ref) {
        return schema.$ref.split('/').pop().replace(/[^a-zA-Z0-9_]/g, '_');
    }
    if (schema.type === 'array' && schema.items) {
        return getTsType(schema.items) + '[]';
    }
    return typeMap[schema.type] || 'any';
}

const paths = openapi.paths || {};

for (const [apiPath, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods)) {
        const operationId = details.operationId || method + apiPath.replace(/[^a-zA-Z0-9]/g, '_');
        const summary = details.summary || '';

        const pathParams = [];
        const queryParams = [];
        if (details.parameters) {
            for (const p of details.parameters) {
                if (p.in === 'path') pathParams.push(p.name + ": " + getTsType(p.schema));
                if (p.in === 'query') queryParams.push(p.name + "?: " + getTsType(p.schema));
            }
        }

        let reqBodyType = 'any';
        if (details.requestBody && details.requestBody.content && details.requestBody.content['application/json']) {
            let rs = details.requestBody.content['application/json'].schema;
            reqBodyType = rs.$ref ? rs.$ref.split('/').pop() : 'any';
        }

        let resType = 'any';
        if (details.responses && details.responses['200'] && details.responses['200'].content && details.responses['200'].content['application/json']) {
            let rs = details.responses['200'].content['application/json'].schema;
            if (rs.$ref) {
                let typeName = rs.$ref.split('/').pop();
                if (typeName.startsWith('ApiResponse_')) {
                    resType = typeName.substring(12);
                } else {
                    resType = typeName;
                }
                if (resType === 'bool') resType = 'boolean';
            }
        }

        const funcParams = [...pathParams];
        if (queryParams.length > 0) {
            funcParams.push("params?: { " + queryParams.join(', ') + " }");
        }
        if (method.toLowerCase() === 'post' || method.toLowerCase() === 'put') {
            if (reqBodyType !== 'any' || !details.requestBody) {
                funcParams.push("data?: any");
            } else {
                funcParams.push("data: any");
            }
        }

        let urlStr = "'" + apiPath + "'";
        if (apiPath.includes('{')) {
            urlStr = "`" + apiPath.replace(/\{([^}]+)\}/g, '${$1}') + "`";
        }

        let reqCall = "";
        if ((method.toLowerCase() === 'get' || method.toLowerCase() === 'delete') && queryParams.length > 0) {
            reqCall = `
  let queryStr = '';
  if (params) {
    const qs = Object.keys(params).filter(k => (params as any)[k] !== undefined).map(k => k + '=' + encodeURIComponent((params as any)[k])).join('&');
    if (qs) queryStr = '?' + qs;
  }
  return request<any>(${urlStr} + queryStr, '${method.toUpperCase()}');`;
        } else {
            reqCall = `  return request<any>(${urlStr}, '${method.toUpperCase()}', ${method.toLowerCase() === 'post' || method.toLowerCase() === 'put' ? 'data' : 'undefined'});`;
        }

        apiTsContent += `
/**
 * ${summary}
 */
export const ${operationId} = async (${funcParams.join(', ')}): Promise<any> => {
${reqCall}
};
`;
    }
}

fs.writeFileSync(path.join(apiDirPath, 'index.ts'), apiTsContent);
console.log('Successfully generated src/utils/request.ts and src/api/index.ts');
