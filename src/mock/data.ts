export interface Product {
  id: string;
  name: string;
  desc?: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  tags?: string[];
  salesTag?: string;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
}

export const mockCategories: Category[] = [
  {
    id: "c1",
    name: "为你推荐",
    products: [
      {
        id: "p1",
        name: "【添加10%香水椰】小象100%椰子水1L",
        desc: "配料仅椰子水 | 口感清冽甘甜",
        price: 9.9,
        imageUrl: 'https://dummyimage.com/200x200/00b26a/ffffff.png&text=%E6%A4%B0%E5%AD%90%E6%B0%B4',
        tags: ["新品"],
        salesTag: "近期销量飙升57%",
        stock: 100,
      },
      {
        id: "p2",
        name: "豆本豆茉莉豆奶250ml*6盒",
        desc: "天然植物蛋白 | 非转基因大豆",
        price: 11.9,
        originalPrice: 13.5,
        imageUrl: 'https://dummyimage.com/200x200/00b26a/ffffff.png&text=%E8%B1%86%E5%A5%B6',
        tags: ["新品", "秒杀价"],
        salesTag: "近期销量飙升112%",
        stock: 50,
      },
      {
        id: "p3",
        name: "维他港式奶茶（奶茶饮料）250ml*6",
        desc: "锡兰红茶 | 醇香可口",
        price: 15.8,
        originalPrice: 26.9,
        imageUrl: 'https://dummyimage.com/200x200/00b26a/ffffff.png&text=%E5%A5%B6%E8%8C%B6',
        tags: ["新品", "5.9折"],
        salesTag: "近期销量飙升57%",
        stock: 200,
      },
      {
        id: "p4",
        name: "农夫山泉水溶C100西柚味复合果汁饮料445ml",
        desc: "充足果味 | 好喝适口",
        price: 4.2,
        originalPrice: 5.5,
        imageUrl: 'https://dummyimage.com/200x200/00b26a/ffffff.png&text=%E6%9E%9C%E6%B1%81',
        tags: ["新品", "8折"],
        salesTag: "近期销量飙升65%",
        stock: 80,
      },
    ],
  },
  {
    id: "c2",
    name: "新品上架",
    products: [
      {
        id: "p5",
        name: "农夫山泉饮用天然水5L*2桶",
        desc: "水源地灌装 | 家庭量贩装",
        price: 15.8,
        originalPrice: 21.8,
        imageUrl: 'https://dummyimage.com/200x200/00b26a/ffffff.png&text=%E5%A4%A9%E7%84%B6%E6%B0%B4',
        tags: ["43%人回购"],
        stock: 50,
      },
      {
        id: "p6",
        name: "【跳跳虾】鲜活大号基围虾500g(20-30只)",
        desc: "蹦跳鲜到家 | 12道品控",
        price: 31.92,
        originalPrice: 43.8,
        imageUrl: 'https://dummyimage.com/200x200/00b26a/ffffff.png&text=%E5%9F%BA%E5%9B%B4%E8%99%BE',
        tags: ["活鲜", "出清价"],
        stock: 10,
      },
    ],
  },
  {
    id: "c3",
    name: "小象独家",
    products: [],
  },
  { id: "c4", name: "白酒/黄酒", products: [] },
  { id: "c5", name: "葡萄酒", products: [] },
  { id: "c6", name: "果汁/椰子水", products: [] },
  { id: "c7", name: "严选", products: [] },
  { id: "c8", name: "鲜啤/啤酒", products: [] },
  { id: "c9", name: "碳酸/功能", products: [] },
  { id: "c10", name: "茶饮/奶茶", products: [] },
];

export const mockUser = {
  name: "小象士兵",
  avatar:
    "https://img12.360buyimg.com/n1/s100x100_jfs/t1/181514/23/15160/125215/60f7e6f8Eb149024f/1f81d8ab1f8ad155.jpg",
  balance: 100.0,
  coupons: 3,
};
