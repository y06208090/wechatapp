import { useEffect, useState } from 'react'
import { Image, Input, Navigator, ScrollView, Text, View } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'

import { mockCategories } from '../../mock/data'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import { list_categories, list_products, search_products } from '../../api'
import './index.scss'

export default function Category() {
  const menuButtonRect = Taro.getMenuButtonBoundingClientRect()
  const systemInfo = Taro.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navBarHeight = menuButtonRect.top > 0
    ? menuButtonRect.bottom - menuButtonRect.top + (menuButtonRect.top - statusBarHeight) * 2
    : 44
  const [topMode, setTopMode] = useState<'goods' | 'courier'>('goods')
  const [activeCategoryId, setActiveCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [animatedProductId, setAnimatedProductId] = useState('')
  const { addItem } = useCart()
  const { currentStore, refreshStore } = useStore() // 获取当前选中门店
  const currentStoreId = currentStore ? currentStore.id : ''
  const currentStoreName = currentStore ? currentStore.name : ''
  const currentStoreDistance =
    currentStore && (currentStore as any).distance_km
      ? `${(currentStore as any).distance_km.toFixed(2)}km`
      : '附近可取'

  useLoad(() => {
    // 首次进入加载门店分类
  })

  useEffect(() => {
    if (currentStoreId) {
      fetchCategories(currentStoreId)
    }
  }, [currentStoreId])

  useEffect(() => {
    if (!currentStoreId) {
      void refreshStore(true)
    }
  }, [currentStoreId, refreshStore])

  useEffect(() => {
    if (currentStoreId && activeCategoryId) {
      fetchProducts(currentStoreId, activeCategoryId)
    }
  }, [currentStoreId, activeCategoryId])

  useEffect(() => {
    if (keyword.trim()) {
      return
    }
    setSearchResults([])
  }, [keyword])

  useEffect(() => {
    const trimmedKeyword = keyword.trim()
    if (!trimmedKeyword || !currentStoreId) {
      return
    }

    const timer = setTimeout(() => {
      handleSearch(trimmedKeyword)
    }, 1000)

    return () => clearTimeout(timer)
  }, [keyword, currentStoreId])

  const fetchCategories = async (storeId: string) => {
    try {
      const res = await list_categories({ store_id: storeId })
      if (res && res.length > 0) {
        setCategories(res)
        setActiveCategoryId(res[0].id)
      } else {
        setCategories([])
      }
    } catch (e) {
      console.error('获取分类失败', e)
    }
  }

  const fetchProducts = async (storeId: string, categoryId: string) => {
    setLoading(true)
    try {
      const res = await list_products({ store_id: storeId, category_id: categoryId })
      if (res && res.items) {
        setProducts(res.items)
      } else {
        setProducts([])
      }
    } catch (e) {
      console.error('获取商品失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (value?: string) => {
    const nextValue = value !== undefined && value !== null ? value : keyword
    const nextKeyword = nextValue.trim()
    setKeyword(nextValue)

    if (!currentStoreId) {
      Taro.showToast({ title: '请先选择门店', icon: 'none' })
      return
    }

    if (!nextKeyword) {
      setSearchResults([])
      if (activeCategoryId) {
        fetchProducts(currentStoreId, activeCategoryId)
      }
      return
    }

    setSearching(true)
    try {
      const res = await search_products({
        store_id: currentStoreId,
        keyword: nextKeyword,
        page: 1,
        page_size: 50,
      })
      setSearchResults(res && res.items ? res.items : [])
    } catch (e) {
      console.error('搜索商品失败', e)
      setSearchResults([])
      Taro.showToast({ title: '搜索失败，请稍后重试', icon: 'none' })
    } finally {
      setSearching(false)
    }
  }

  const handleAddCart = async (e: any, product: any) => {
    e.stopPropagation();
    try {
      const added = await addItem({
        id: product.id,
        name: product.title || product.name,
        price: product.price,
        imageUrl: product.cover_image || product.imageUrl
      });
      if (!added) {
        return
      }
      setAnimatedProductId(product.id)
      setTimeout(() => setAnimatedProductId(''), 420)
      Taro.showToast({
        title: '已加入购物车',
        icon: 'success',
        duration: 1000,
      });
    } catch (_error) { }
  }

  const handleStoreSwitch = async () => {
    Taro.navigateTo({ url: '/pages/store-select/index' })
  }

  const handleGoDetail = (id: string) => {
    Taro.navigateTo({
      url: `/pages/product-detail/index?id=${id}`
    })
  }

  const handleSwitchTopMode = (mode: 'goods' | 'courier') => {
    if (mode === 'goods') {
      setTopMode('goods')
      return
    }

    setTopMode('courier')
    Taro.navigateTo({ url: '/pages/courier/index' })
    setTimeout(() => setTopMode('goods'), 0)
  }

  // Fallback to mock data if real API yields nothing in dev
  const displayCategories = categories.length > 0 ? categories : mockCategories
  const activeMockCategory = activeCategoryId ? mockCategories.find(c => c.id === activeCategoryId) : null
  const categoryProducts = products.length > 0 ? products : (activeMockCategory ? activeMockCategory.products || [] : [])
  const isSearchMode = keyword.trim().length > 0
  const displayProducts = isSearchMode ? searchResults : categoryProducts

  return (
    <View className='category-page'>
      <View
        className='custom-nav-shell'
        style={{ paddingTop: `${statusBarHeight}px` }}
      >
        <View
          className='custom-nav-row'
          style={{ minHeight: `${navBarHeight}px` }}
        >
          <View className='fulfillment-switch'>
            <View
              className={`fulfillment-switch__item ${topMode === 'goods' ? 'is-active' : ''}`}
              onClick={() => handleSwitchTopMode('goods')}
            >
              商品
            </View>
            <View
              className={`fulfillment-switch__item ${topMode === 'courier' ? 'is-active' : ''}`}
              onClick={() => handleSwitchTopMode('courier')}
            >
              快递
            </View>
          </View>
          <View className='nav-search-shell'>
            <Text className='nav-search-shell__icon'>⌕</Text>
            <Input
              className='nav-search-shell__input'
              placeholder='商品或品类'
              value={keyword}
              confirmType='search'
              onInput={(e) => setKeyword(e.detail.value)}
              onConfirm={(e) => handleSearch(e.detail.value)}
            />
            {keyword ? (
              <View
                className='nav-search-shell__clear'
                onClick={() => {
                  setKeyword('')
                  setSearchResults([])
                }}
              >
                取消
              </View>
            ) : null}
          </View>
          <View
            className='nav-capsule-spacer'
            style={{ width: `${(menuButtonRect && menuButtonRect.width ? menuButtonRect.width : 88) + 12}px` }}
          />
          {/* <View
            className="custom-nav-actions"
            style={{ width: `${menuButtonRect.width || 96}px` }}
          >
            <View className="custom-nav-pill">
              <View className="custom-nav-pill__action custom-nav-pill__action--locate" />
              <View className="custom-nav-pill__divider" />
              <View className="custom-nav-pill__action custom-nav-pill__action--target" />
            </View>
          </View> */}
        </View>
        <View className="top-bar">
          <View className="store-summary" onClick={handleStoreSwitch}>
            <View className="store-summary__main">
              <Text className="store-summary__icon">◎</Text>
              <Text className="store-summary__name">{currentStoreName || '请选择门店'}</Text>
              <Text className="store-summary__distance">
                {currentStoreDistance}
              </Text>
            </View>
            <Text className="store-summary__arrow">{'>'}</Text>
          </View>
        </View>
      </View>

      <Navigator url='/pages/courier/index' className='courier-banner'>
        <View className='courier-banner-left'>
          <View className='icon-wrapper'>
            <Text className='icon'>📦</Text>
          </View>
          <View className='text-info'>
            <Text className='banner-title'>顺路代取快递</Text>
            <Text className='banner-subtitle'>随时下单，最快30分钟送达桌前</Text>
          </View>
        </View>
        <View className='courier-banner-right'>立即下单 <Text className='arrow'>{'>'}</Text></View>
      </Navigator>

      <View className='main-content'>
        <ScrollView className='sidebar' scrollY>
          {displayCategories.map((category) => (
            <View
              key={category.id}
              className={`category-item ${activeCategoryId === category.id ? 'active' : ''}`}
              onClick={() => {
                setKeyword('')
                setSearchResults([])
                setActiveCategoryId(category.id)
              }}
            >
              {category.name}
            </View>
          ))}
        </ScrollView>

        <ScrollView className='product-list' scrollY>
          {isSearchMode ? (
            <View className='search-summary'>
              {searching ? '搜索中...' : `搜索结果 ${displayProducts.length} 条`}
            </View>
          ) : null}
          {displayProducts.length > 0 ? (
            displayProducts.map((product: any) => (
              <View className='product-item' key={product.id} onClick={() => handleGoDetail(product.id)}>
                <Image className='product-img' src={product.cover_image || product.imageUrl} mode='aspectFill' />
                <View className='product-info'>
                  <View>
                    <View className='name'>{product.title || product.name}</View>
                    <View className='desc'>{product.subtitle || product.desc}</View>
                    <View className='tags'>
                      {product.tags && product.tags.map((tag: string, index: number) => (
                        <Text key={index} className='tag'>{tag}</Text>
                      ))}
                      {product.salesTag && (
                        <Text className='sales-tag'>{product.salesTag}</Text>
                      )}
                    </View>
                  </View>
                  <View className='price-row'>
                    <View>
                      <Text className='price'><Text className='symbol'>¥</Text>{((product.price || 0) / 100).toFixed(2)}</Text>
                      {product.original_price && (
                        <Text className='original-price'>¥{((product.original_price || 0) / 100).toFixed(2)}</Text>
                      )}
                    </View>
                    <View
                      className={`add-cart-btn ${animatedProductId === product.id ? 'is-bumping' : ''}`}
                      onClick={(e) => handleAddCart(e, product)}
                    >
                      +
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className='empty-state'>
              {loading || searching ? '加载中...' : isSearchMode ? '没有搜到相关商品' : '该分类下暂无商品~'}
            </View>
          )}
        </ScrollView>
      </View>

    </View>
  )
}
