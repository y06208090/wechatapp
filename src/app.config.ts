export default defineAppConfig({
  pages: [
    'pages/category/index',
    'pages/store-select/index',
    'pages/login/index',
    'pages/cart/index',
    'pages/profile/index',
    'pages/courier/index',
    'pages/order/index',
    'pages/courier-order/index',
    'pages/courier-order-detail/index',
    'pages/member/index',
    'pages/address/index',
    'pages/address-edit/index',
    'pages/merchant/index',
    'pages/setting/index',
    'pages/product-detail/index',
    'pages/checkout/index',
    'pages/order-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '小象超市',
    navigationBarTextStyle: 'black'
  },
  permission: {
    'scope.userLocation': {
      desc: '用于获取当前位置并匹配最近可服务门店'
    }
  },
  requiredPrivateInfos: ['getLocation', 'chooseLocation'],
  tabBar: {
    color: '#999999',
    selectedColor: '#00B26A',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/category/index',
        text: '分类'
      },
      {
        pagePath: 'pages/cart/index',
        text: '购物车'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
})
