# Wechatapp

基于 Taro + React 的微信小程序前端，面向 C 端用户。

## 功能范围

- 微信授权登录
- 手机号验证码登录
- 门店选择
- 类目、商品、购物车
- 地址、订单、跑腿订单
- 会员与个人中心

## 技术栈

- Taro 4
- React 18
- TypeScript
- Sass

## 目录

```text
src/
  pages/       小程序页面
  api/         接口封装
  store/       React Context 全局状态
  utils/       请求与工具
config/        taro dev/prod 配置
dist/          构建产物（微信开发者工具指向这里）
```

## 本地启动

安装依赖后执行：

```bash
npm install
npm run dev:weapp
```

然后用微信开发者工具打开本项目，`miniprogramRoot` 指向 `dist/`。

## 联调说明

- 当前小程序只对接 `../ministore-wechat-backend`
- 微信授权登录依赖后端配置 `APP__WECHAT__APP_ID` / `APP__WECHAT__APP_SECRET`
- 小程序页面清单见 `src/app.config.ts`
