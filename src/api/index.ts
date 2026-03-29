import { request } from '../utils/request';


/**
 * 接口功能：list_addresses，查询当前用户收货地址列表
 */
export const list_addresses = async (): Promise<any> => {
  return request<any>('/addresses', 'GET', undefined);
};

/**
 * 接口功能：get_address，查询指定收货地址详情
 */
export const get_address = async (id: string): Promise<any> => {
  return request<any>(`/addresses/${id}`, 'GET', undefined);
};

/**
 * 接口功能：create_address，创建用户收货地址
 */
export const create_address = async (data?: any): Promise<any> => {
  return request<any>('/addresses', 'POST', data);
};

/**
 * 接口功能：update_address，更新收货地址信息
 */
export const update_address = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/addresses/${id}`, 'PUT', data);
};

/**
 * 接口功能：delete_address，删除指定收货地址
 */
export const delete_address = async (id: string): Promise<any> => {
  return request<any>(`/addresses/${id}`, 'DELETE', undefined);
};

/**
 * 接口功能：set_default_address，设置默认收货地址
 */
export const set_default_address = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/addresses/${id}/set_default`, 'POST', data);
};

/**
 * 接口功能：admin_create_category，后台创建类目
 */
export const admin_create_category = async (data?: any): Promise<any> => {
  return request<any>('/admin/categories', 'POST', data);
};

/**
 * 接口功能：admin_update_category，后台更新类目
 */
export const admin_update_category = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/admin/categories/${id}`, 'PUT', data);
};

/**
 * 接口功能：admin_get_config，后台查询全局配置
 */
export const admin_get_config = async (): Promise<any> => {
  return request<any>('/admin/config', 'GET', undefined);
};

/**
 * 接口功能：admin_update_config，后台更新全局配置
 */
export const admin_update_config = async (data?: any): Promise<any> => {
  return request<any>('/admin/config', 'PUT', data);
};

/**
 * 接口功能：admin_list_orders，后台按门店与状态查询商品订单
 */
export const admin_list_orders = async (params?: { store_id?: string, status?: string }): Promise<any> => {

  let queryStr = '';
  if (params) {
    const qs = Object.keys(params).filter(k => (params as any)[k] !== undefined).map(k => k + '=' + encodeURIComponent((params as any)[k])).join('&');
    if (qs) queryStr = '?' + qs;
  }
  return request<any>('/admin/orders' + queryStr, 'GET');
};

/**
 * 接口功能：admin_accept_order，后台接单并流转商品订单状态
 */
export const admin_accept_order = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/admin/orders/${id}/accept`, 'POST', data);
};

/**
 * 接口功能：admin_complete_order，后台完成商品订单
 */
export const admin_complete_order = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/admin/orders/${id}/complete`, 'POST', data);
};

/**
 * 接口功能：admin_dispatch_order，后台标记商品订单为配送中
 */
export const admin_dispatch_order = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/admin/orders/${id}/dispatch`, 'POST', data);
};

/**
 * 接口功能：admin_create_product，后台创建商品
 */
export const admin_create_product = async (data?: any): Promise<any> => {
  return request<any>('/admin/products', 'POST', data);
};

/**
 * 接口功能：admin_update_product，后台更新商品
 */
export const admin_update_product = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/admin/products/${id}`, 'PUT', data);
};

/**
 * 接口功能：admin_list_runner_orders，后台按门店与状态查询跑腿订单
 */
export const admin_list_runner_orders = async (params?: { store_id?: string, status?: string }): Promise<any> => {

  let queryStr = '';
  if (params) {
    const qs = Object.keys(params).filter(k => (params as any)[k] !== undefined).map(k => k + '=' + encodeURIComponent((params as any)[k])).join('&');
    if (qs) queryStr = '?' + qs;
  }
  return request<any>('/admin/runner_orders' + queryStr, 'GET');
};

/**
 * 接口功能：admin_accept_runner_order，后台接单并流转跑腿订单状态
 */
export const admin_accept_runner_order = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/admin/runner_orders/${id}/accept`, 'POST', data);
};

/**
 * 接口功能：admin_complete_runner_order，后台完成跑腿订单
 */
export const admin_complete_runner_order = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/admin/runner_orders/${id}/complete`, 'POST', data);
};

/**
 * 接口功能：admin_delivered_runner_order，后台标记跑腿订单为已送达
 */
export const admin_delivered_runner_order = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/admin/runner_orders/${id}/delivered`, 'POST', data);
};

/**
 * 接口功能：admin_list_stores，后台查询门店列表
 */
export const admin_list_stores = async (): Promise<any> => {
  return request<any>('/admin/stores', 'GET', undefined);
};

/**
 * 接口功能：admin_create_store，后台创建门店
 */
export const admin_create_store = async (data?: any): Promise<any> => {
  return request<any>('/admin/stores', 'POST', data);
};

/**
 * 接口功能：admin_update_store，后台更新门店
 */
export const admin_update_store = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/admin/stores/${id}`, 'PUT', data);
};

/**
 * 接口功能：admin_login，管理员账号密码登录并签发令牌
 */
export const admin_login = async (data?: any): Promise<any> => {
  return request<any>('/auth/login', 'POST', data);
};

/**
 * 接口功能：phone_sms_login，手机号验证码登录并绑定微信信息
 */
export const phone_sms_login = async (data?: any): Promise<any> => {
  return request<any>('/auth/phone_sms_login', 'POST', data);
};

/**
 * 接口功能：send_sms_code，发送短信验证码
 */
export const send_sms_code = async (data?: any): Promise<any> => {
  return request<any>('/auth/sms/send_code', 'POST', data);
};

/**
 * 接口功能：wechat_login，微信授权登录并签发令牌
 */
export const wechat_login = async (data?: any): Promise<any> => {
  return request<any>('/auth/wechat_login', 'POST', data);
};

/**
 * 接口功能：get_me，获取当前登录用户资料
 */
export const get_me = async (): Promise<any> => {
  return request<any>('/me', 'GET', undefined);
};

/**
 * 接口功能：update_me_profile，更新当前登录用户昵称和头像
 */
export const update_me_profile = async (data?: any): Promise<any> => {
  return request<any>('/me/profile', 'PATCH', data);
};

/**
 * 接口功能：get_cart，获取指定门店购物车
 */
export const get_cart = async (params?: { store_id?: string }): Promise<any> => {

  let queryStr = '';
  if (params) {
    const qs = Object.keys(params).filter(k => (params as any)[k] !== undefined).map(k => k + '=' + encodeURIComponent((params as any)[k])).join('&');
    if (qs) queryStr = '?' + qs;
  }
  return request<any>('/cart' + queryStr, 'GET');
};

/**
 * 接口功能：add_item，添加商品到购物车
 */
export const add_item = async (data?: any): Promise<any> => {
  return request<any>('/cart/add', 'POST', data);
};

/**
 * 接口功能：clear_cart，清空指定门店购物车
 */
export const clear_cart = async (data?: any): Promise<any> => {
  return request<any>('/cart/clear', 'POST', data);
};

/**
 * 接口功能：remove_item，从购物车移除商品
 */
export const remove_item = async (data?: any): Promise<any> => {
  return request<any>('/cart/remove', 'POST', data);
};

/**
 * 接口功能：update_qty，更新购物车商品数量
 */
export const update_qty = async (data?: any): Promise<any> => {
  return request<any>('/cart/update_qty', 'POST', data);
};

/**
 * 接口功能：list_categories，获取门店商品分类列表
 */
export const list_categories = async (params?: { store_id?: string }): Promise<any> => {

  let queryStr = '';
  if (params) {
    const qs = Object.keys(params).filter(k => (params as any)[k] !== undefined).map(k => k + '=' + encodeURIComponent((params as any)[k])).join('&');
    if (qs) queryStr = '?' + qs;
  }
  return request<any>('/categories' + queryStr, 'GET');
};

/**
 * 接口功能：get_config，获取小程序全局配置
 */
export const get_config = async (): Promise<any> => {
  return request<any>('/config', 'GET', undefined);
};

/**
 * 接口功能：member_benefits，获取会员权益说明
 */
export const member_benefits = async (): Promise<any> => {
  return request<any>('/member/benefits', 'GET', undefined);
};

/**
 * 接口功能：member_status，获取当前会员状态
 */
export const member_status = async (): Promise<any> => {
  return request<any>('/member/status', 'GET', undefined);
};

/**
 * 接口功能：list_orders，查询当前用户商品订单列表
 */
export const list_orders = async (params?: { status?: string }): Promise<any> => {

  let queryStr = '';
  if (params) {
    const qs = Object.keys(params).filter(k => (params as any)[k] !== undefined).map(k => k + '=' + encodeURIComponent((params as any)[k])).join('&');
    if (qs) queryStr = '?' + qs;
  }
  return request<any>('/orders' + queryStr, 'GET');
};

/**
 * 接口功能：create_order，提交并创建商品订单
 */
export const create_order = async (data?: any): Promise<any> => {
  return request<any>('/orders/create', 'POST', data);
};

/**
 * 接口功能：pay_order，发起商品订单支付
 */
export const pay_order = async (data?: any): Promise<any> => {
  return request<any>('/orders/pay', 'POST', data);
};

/**
 * 接口功能：preview_order，预览订单金额与可配送性
 */
export const preview_order = async (data?: any): Promise<any> => {
  return request<any>('/orders/preview', 'POST', data);
};

/**
 * 接口功能：get_order，获取商品订单详情
 */
export const get_order = async (id: string): Promise<any> => {
  return request<any>(`/orders/${id}`, 'GET', undefined);
};

/**
 * 接口功能：cancel_order，取消商品订单
 */
export const cancel_order = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/orders/${id}/cancel`, 'POST', data);
};

/**
 * 接口功能：simulate_progress_order，模拟推进订单状态
 */
export const simulate_progress_order = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/orders/${id}/simulate_progress`, 'POST', data);
};

/**
 * 接口功能：repurchase_order，基于历史订单再次下单
 */
export const repurchase_order = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/orders/${id}/repurchase`, 'POST', data);
};

/**
 * 接口功能：list_products，分页查询门店商品列表
 */
export const list_products = async (params?: { store_id?: string, category_id?: string, page?: number, page_size?: number }): Promise<any> => {

  let queryStr = '';
  if (params) {
    const qs = Object.keys(params).filter(k => (params as any)[k] !== undefined).map(k => k + '=' + encodeURIComponent((params as any)[k])).join('&');
    if (qs) queryStr = '?' + qs;
  }
  return request<any>('/products' + queryStr, 'GET');
};

/**
 * 接口功能：search_products，按关键词搜索门店商品
 */
export const search_products = async (params?: { store_id?: string, keyword?: string, page?: number, page_size?: number }): Promise<any> => {

  let queryStr = '';
  if (params) {
    const qs = Object.keys(params).filter(k => (params as any)[k] !== undefined).map(k => k + '=' + encodeURIComponent((params as any)[k])).join('&');
    if (qs) queryStr = '?' + qs;
  }
  return request<any>('/products/search' + queryStr, 'GET');
};

/**
 * 接口功能：get_product，获取商品详情
 */
export const get_product = async (id: string, params?: { store_id?: string }): Promise<any> => {

  let queryStr = '';
  if (params) {
    const qs = Object.keys(params).filter(k => (params as any)[k] !== undefined).map(k => k + '=' + encodeURIComponent((params as any)[k])).join('&');
    if (qs) queryStr = '?' + qs;
  }
  return request<any>(`/products/${id}` + queryStr, 'GET');
};

/**
 * 接口功能：list_runner_orders，查询当前用户跑腿订单列表
 */
export const list_runner_orders = async (params?: { status?: string }): Promise<any> => {

  let queryStr = '';
  if (params) {
    const qs = Object.keys(params).filter(k => (params as any)[k] !== undefined).map(k => k + '=' + encodeURIComponent((params as any)[k])).join('&');
    if (qs) queryStr = '?' + qs;
  }
  return request<any>('/runner_orders' + queryStr, 'GET');
};

/**
 * 接口功能：create_runner_order，提交并创建跑腿订单
 */
export const create_runner_order = async (data?: any): Promise<any> => {
  return request<any>('/runner_orders/create', 'POST', data);
};

/**
 * 接口功能：pay_runner_order，发起跑腿订单支付
 */
export const pay_runner_order = async (data?: any): Promise<any> => {
  return request<any>('/runner_orders/pay', 'POST', data);
};

/**
 * 接口功能：get_runner_order，获取跑腿订单详情
 */
export const get_runner_order = async (id: string): Promise<any> => {
  return request<any>(`/runner_orders/${id}`, 'GET', undefined);
};

/**
 * 接口功能：cancel_runner_order，取消跑腿订单
 */
export const cancel_runner_order = async (id: string, data?: any): Promise<any> => {
  return request<any>(`/runner_orders/${id}/cancel`, 'POST', data);
};

/**
 * 接口功能：current_store，获取用户当前已选择门店
 */
export const current_store = async (): Promise<any> => {
  console.log(440);

  return request<any>('/stores/current', 'GET', undefined);
};

/**
 * 接口功能：nearby_stores，查询附近可服务门店
 */
export const nearby_stores = async (params?: { lat?: number, lng?: number }): Promise<any> => {

  let queryStr = '';
  if (params) {
    const qs = Object.keys(params).filter(k => (params as any)[k] !== undefined).map(k => k + '=' + encodeURIComponent((params as any)[k])).join('&');
    if (qs) queryStr = '?' + qs;
  }
  return request<any>('/stores/nearby' + queryStr, 'GET');
};

/**
 * 接口功能：select_store，选择并保存当前门店
 */
export const select_store = async (data?: any): Promise<any> => {
  return request<any>('/stores/select', 'POST', data);
};
