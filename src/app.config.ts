export default defineAppConfig({
  pages: [
    'pages/category/index',
    'pages/cart/index',
    'pages/profile/index',
    'pages/courier/index',
    'pages/order/index',
    'pages/courier-order/index',
    'pages/member/index',
    'pages/address/index',
    'pages/merchant/index',
    'pages/setting/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '小象超市',
    navigationBarTextStyle: 'black'
  },
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
