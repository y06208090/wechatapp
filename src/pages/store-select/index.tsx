import { useMemo, useState } from 'react'
import { Input, Map, ScrollView, Text, View } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'

import { nearby_stores, select_store } from '../../api'
import { resolveUserLocation, useStore } from '../../store/StoreContext'

import './index.scss'

type LocationPoint = {
  lat: number;
  lng: number;
}

type StoreItem = {
  id: string;
  name: string;
  address?: string;
  lat?: number | string;
  lng?: number | string;
  distance_km?: number | string | null;
  deliverable?: boolean;
  business_hours?: string;
  [key: string]: any;
}

const DEFAULT_CITY_LABEL = '\u5f53\u524d\u57ce\u5e02'
const LOCATING_CITY_LABEL = '\u5b9a\u4f4d\u4e2d'

const coerceStoreInfo = (store: StoreItem) => ({
  ...(store as any),
  address: typeof store.address === 'string' ? store.address : '',
  phone: typeof (store as any).phone === 'string' ? (store as any).phone : '',
  status: typeof (store as any).status === 'string' ? (store as any).status : '',
})

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const calcDistanceKm = (from: LocationPoint, latValue: unknown, lngValue: unknown): number | null => {
  const lat = toFiniteNumber(latValue)
  const lng = toFiniteNumber(lngValue)
  if (lat === null || lng === null) {
    return null
  }

  const toRad = (degree: number) => degree * Math.PI / 180
  const earthRadiusKm = 6371
  const dLat = toRad(lat - from.lat)
  const dLng = toRad(lng - from.lng)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRad(from.lat)) * Math.cos(toRad(lat))
    * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

const formatDistanceKm = (value: unknown) => {
  const distance = toFiniteNumber(value)
  return distance === null ? '0.00' : distance.toFixed(2)
}

const normalizeCityLabel = (city: string) => city.replace(/\s+/g, '').replace(/\u5e02$/, '')

const resolveCityFromLocation = async (location: LocationPoint): Promise<string> => {
  const mapKey = typeof __TENCENT_MAP_KEY__ === 'string' ? __TENCENT_MAP_KEY__.trim() : ''
  console.log(mapKey,location,69);
  
  if (!mapKey) {
    return ''
  }

  try {
    const res = await Taro.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      method: 'GET',
      data: {
        location: `${location.lat},${location.lng}`,
        key: mapKey,
        get_poi: 0,
      },
    })
    console.log(res,85);
    
    const payload: any = res && (res.data as any)
    if (!payload || payload.status !== 0) {
      return ''
    }
    const city = payload?.result?.address_component?.city
    return typeof city === 'string' && city.trim() ? normalizeCityLabel(city.trim()) : ''
  } catch (_error) {
    return ''
  }
}

const extractCityFromAddress = (address: unknown): string => {
  if (typeof address !== 'string') {
    return ''
  }

  const cleanedAddress = address.trim().replace(/\s+/g, '')
  if (!cleanedAddress) {
    return ''
  }

  const municipalityMatch = cleanedAddress.match(/(\u5317\u4eac\u5e02|\u4e0a\u6d77\u5e02|\u5929\u6d25\u5e02|\u91cd\u5e86\u5e02)/)
  if (municipalityMatch && municipalityMatch[1]) {
    return normalizeCityLabel(municipalityMatch[1])
  }

  let segment = cleanedAddress
  const regionSuffixes = ['\u7701', '\u81ea\u6cbb\u533a', '\u7279\u522b\u884c\u653f\u533a']
  for (const suffix of regionSuffixes) {
    const index = segment.indexOf(suffix)
    if (index >= 0) {
      segment = segment.slice(index + suffix.length)
      break
    }
  }

  const cityMatch = segment.match(/([\u4e00-\u9fa5]{2,}(?:\u81ea\u6cbb\u5dde|\u5730\u533a|\u76df|\u5e02))/)
  if (cityMatch && cityMatch[1]) {
    return normalizeCityLabel(cityMatch[1])
  }

  return ''
}

const extractCityFromStore = (store: StoreItem | null | undefined): string => {
  if (!store) {
    return ''
  }

  const possibleCity = [store.city, store.city_name, store.region, store.district]
    .find((item) => typeof item === 'string' && item.trim())
  if (typeof possibleCity === 'string' && possibleCity.trim()) {
    return normalizeCityLabel(possibleCity.trim())
  }

  return extractCityFromAddress(store.address)
}

export default function StoreSelect() {
  const { currentStore, setStore } = useStore()
  const currentStoreId = currentStore ? currentStore.id : ''
  const [stores, setStores] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [userLocation, setUserLocation] = useState<LocationPoint | null>(null)
  const [initialLocation, setInitialLocation] = useState<LocationPoint | null>(null)
  const [focusedStoreId, setFocusedStoreId] = useState('')
  const [cityLabel, setCityLabel] = useState(DEFAULT_CITY_LABEL)
  const [locatingCity, setLocatingCity] = useState(true)

  useLoad(() => {
    void fetchNearbyStores()
  })

  const fetchNearbyStores = async () => {
    setLocatingCity(true)
    setLoading(true)
    Taro.showLoading({ title: '加载中...' })
    try {
      const location = await resolveUserLocation()
      setUserLocation(location)
      setInitialLocation(location)
      const locatedCity = await resolveCityFromLocation(location)
      console.log(locatedCity,170);
      
      if (locatedCity) {
        setCityLabel(locatedCity)
      }
      const res = await nearby_stores({ lat: location.lat, lng: location.lng })
      if (Array.isArray(res)) {
        const storesWithLocalDistance: StoreItem[] = res.map((store: StoreItem) => {
          const localDistanceKm = calcDistanceKm(location, store && store.lat, store && store.lng)
          const remoteDistanceKm = toFiniteNumber(store && store.distance_km)
          return {
            ...store,
            distance_km: localDistanceKm === null ? remoteDistanceKm : localDistanceKm,
          }
        })

        const sortedStores = [...storesWithLocalDistance].sort((left, right) => {
          const leftDistance = toFiniteNumber(left.distance_km)
          const rightDistance = toFiniteNumber(right.distance_km)
          if (leftDistance === null && rightDistance === null) {
            return 0
          }
          if (leftDistance === null) {
            return 1
          }
          if (rightDistance === null) {
            return -1
          }
          return leftDistance - rightDistance
        })

        setStores(sortedStores)
        const firstStoreId = sortedStores.length > 0 && sortedStores[0] ? sortedStores[0].id : ''
        setFocusedStoreId(currentStoreId || firstStoreId || '')
    
      }
    } catch (e: any) {
      Taro.showToast({ title: e.message || '获取门店失败', icon: 'none' })
    } finally {
      setLocatingCity(false)
      setLoading(false)
      Taro.hideLoading()
    }
  }

  const handleSelect = async (store: StoreItem) => {
    try {
      Taro.showLoading({ title: '切换中...' })
      const token = Taro.getStorageSync('token')
      if (token) {
        const res = await select_store({ store_id: store.id })
        if (res) {
          setStore(res)
        }
      } else {
        setStore(coerceStoreInfo(store))
      }
      Taro.showToast({ title: '门店已切换', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack({
          fail: () => {
            Taro.switchTab({ url: '/pages/category/index' })
          },
        })
      }, 1000)
    } catch (e: any) {
      Taro.showToast({ title: e.message || '切换门店失败', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  }

  const filteredStores = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase()
    if (!trimmedKeyword) {
      return stores
    }

    return stores.filter((store) =>
      [store.name, store.address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(trimmedKeyword)),
    )
  }, [keyword, stores])

  const focusedStore = useMemo(
    () => filteredStores.find((store) => store.id === focusedStoreId)
      || stores.find((store) => store.id === focusedStoreId)
      || filteredStores[0]
      || stores[0]
      || null,
    [filteredStores, focusedStoreId, stores],
  )

  const mapLatitude = (initialLocation && initialLocation.lat) 
  const mapLongitude = (initialLocation && initialLocation.lng) 
  const displayedCity = locatingCity ? LOCATING_CITY_LABEL : cityLabel

  return (
    <View className='store-select'>
      <View className='hero'>
        <Map
          className='store-map'
          latitude={mapLatitude ?? 0}
          longitude={mapLongitude ?? 0}
          scale={15}
          showLocation
          onError={() => {}}
        />
        <View className='hero-overlay'>
          <View className='hero-header'>
            <Text className='hero-title'>更多门店</Text>
            <Text className='hero-subtitle'>地图浏览附近门店，支持名称和地址搜索</Text>
          </View>
          <View className='hero-search'>
            <View className='hero-search__city-wrap'>
              <Text className='hero-search__city-dot' />
              <Text className='hero-search__city'>{displayedCity}</Text>
            </View>
            <Input
              className='hero-search__input'
              placeholder='输入门店名称或地址搜索'
              value={keyword}
              onInput={(e) => setKeyword(e.detail.value)}
            />
          </View>
          {focusedStore ? (
            <View className='hero-focus-card'>
              <View className='hero-focus-card__main'>
                <Text className='hero-focus-card__name'>{focusedStore.name}</Text>
                <Text className='hero-focus-card__meta'>
                  距您{formatDistanceKm(focusedStore.distance_km)}km
                </Text>
              </View>
              <Text className='hero-focus-card__action'>查看</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className='list-panel'>
        <View className='list-panel__header'>
          <Text className='list-panel__title'>附近</Text>
          <Text className='list-panel__count'>{filteredStores.length} 家门店</Text>
        </View>

        <ScrollView scrollY className='store-list'>
          {filteredStores.map((store) => (
            <View
              key={store.id}
              className={`store-item ${currentStoreId === store.id ? 'active' : ''} ${!store.deliverable ? 'disabled' : ''}`}
              onClick={() => setFocusedStoreId(store.id)}
            >
              <View className='info'>
                <View className='headline'>
                  <Text className='name'>{store.name}</Text>
                  {currentStoreId === store.id ? (
                    <View className='status'>当前选择</View>
                  ) : null}
                </View>
                <Text className='distance'>
                  距您{formatDistanceKm(store.distance_km)}km
                  <Text className='divider'> | </Text>
                  {store.address}
                </Text>
                <View className='meta-row'>
                  <Text className='hours'>{store.business_hours}</Text>
                  <Text className={`tag ${store.deliverable ? 'deliverable' : 'un-deliverable'}`}>
                    {store.deliverable ? '可配送' : '超出范围'}
                  </Text>
                </View>
              </View>
              <View
                className={`select-btn ${currentStoreId === store.id ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (store.deliverable) {
                    void handleSelect(store)
                  }
                }}
              >
                {currentStoreId === store.id ? '已选' : '选择'}
              </View>
            </View>
          ))}
          {!loading && filteredStores.length === 0 && (
            <View className='empty'>没有搜到匹配门店</View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}
