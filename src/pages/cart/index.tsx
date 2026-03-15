import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useCart } from '../../store/CartContext'
import './index.scss'

export default function Cart() {
  const {
    items,
    updateQuantity,
    toggleSelect,
    toggleSelectAll,
    totalPrice,
    isAllSelected,
    syncCart,
    syncing,
  } = useCart()

  useDidShow(() => {
    void syncCart()
  })

  const handleCheckout = async () => {
    const latestItems = await syncCart()
    const selectedItemsCount = latestItems.filter(item => item.selected && item.available !== false).length;
    if (selectedItemsCount === 0) {
      Taro.showToast({ title: '请先选择可结算商品', icon: 'none' })
      return
    }
    Taro.navigateTo({
      url: '/pages/checkout/index'
    })
  }

  const goShopping = () => {
    Taro.switchTab({
      url: '/pages/category/index'
    })
  }

  if (!items || items.length === 0) {
    return (
      <View className="cart-page">
        <View className="empty-cart">
          <Image
            className="empty-icon"
            src=""
          />
          <Text className="empty-text">您的购物车还空着呢~快去逛逛吧</Text>
          <View className="go-shopping-btn" onClick={goShopping}>去逛逛</View>
        </View>
      </View>
    )
  }

  return (
    <View className="cart-page">
      {syncing ? (
        <View className="sync-tip">正在同步购物车和商品状态...</View>
      ) : null}
      <ScrollView className="cart-list" scrollY>
        <View className="cart-list-inner">
          {items.map((item) => (
            <View className={`cart-item ${item.available === false ? 'is-disabled' : ''}`} key={item.id}>
              <View
                className={`checkbox ${item.selected ? 'checked' : ''} ${item.available === false ? 'disabled' : ''}`}
                onClick={() => {
                  if (item.available === false) {
                    return
                  }
                  toggleSelect(item.id)
                }}
              ></View>
              <Image className="item-img" src={item.imageUrl} mode="aspectFill" />
              <View className="item-info">
                <View className="name">{item.name}</View>
                {item.available === false ? (
                  <Text className="invalid-reason">{item.invalidReason || '当前不可购买'}</Text>
                ) : null}
                <View className="bottom-row">
                  <Text className="price">¥{((item.price || 0) / 100).toFixed(2)}</Text>
                  <View className="quantity-control">
                    <View
                      className={`btn ${item.available === false ? 'disabled' : ''}`}
                      onClick={() => {
                        if (item.available === false) {
                          return
                        }
                        void updateQuantity(item.id, item.quantity - 1)
                      }}
                    >
                      -
                    </View>
                    <Text className="num">{item.quantity}</Text>
                    <View
                      className={`btn ${item.available === false ? 'disabled' : ''}`}
                      onClick={() => {
                        if (item.available === false) {
                          return
                        }
                        void updateQuantity(item.id, item.quantity + 1)
                      }}
                    >
                      +
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="free-shipping-tip">
        <Text className="icon">📍</Text>
        <Text className="text">当前距门店 2.8km，🎉<Text className="highlight">享受 3km 内免配送费</Text>特权！</Text>
      </View>

      <View className="bottom-bar">
        <View className="select-all" onClick={toggleSelectAll}>
          <View className={`checkbox ${isAllSelected ? 'checked' : ''}`}></View>
          <Text className="text">全选</Text>
        </View>
        <View className="right-action">
          <View className="total-info">
            <Text className="label">合计: </Text>
            <Text className="price">¥{((totalPrice || 0) / 100).toFixed(2)}</Text>
          </View>
          <View
            className={`checkout-btn ${totalPrice > 0 ? 'active' : ''}`}
            onClick={() => void handleCheckout()}
          >
            结算
          </View>
        </View>
      </View>
    </View>
  )
}
