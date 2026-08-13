export interface RailwayStation {
  id: string;
  name: string; // e.g. "汉口站", "武汉站"
  lat: number;  // latitude
  lng: number;  // longitude
  address?: string;
}

export interface CityStationRecord {
  id: string;
  cityName: string; // e.g. "武汉"
  province: string; // e.g. "湖北"
  cityLat: number;
  cityLng: number;
  stations: RailwayStation[];
}

export const DEFAULT_CITY_STATION_RECORDS: CityStationRecord[] = [
  // 湖北省城市 (优先完整配置)
  {
    id: 'city-wuhan',
    cityName: '武汉',
    province: '湖北',
    cityLat: 30.5928,
    cityLng: 114.3055,
    stations: [
      { id: 'st-wuhan-hankou', name: '汉口站', lat: 30.6186, lng: 114.2562 },
      { id: 'st-wuhan-wuhan', name: '武汉站', lat: 30.6072, lng: 114.4258 },
      { id: 'st-wuhan-wuchang', name: '武昌站', lat: 30.5317, lng: 114.3168 },
      { id: 'st-wuhan-east', name: '武汉东站', lat: 30.4901, lng: 114.4285 },
      { id: 'st-wuhan-hanchuan', name: '汉川站', lat: 30.6385, lng: 113.8421 },
      { id: 'st-wuhan-tianhe', name: '天河机场站', lat: 30.7712, lng: 114.2185 },
    ],
  },
  {
    id: 'city-huangshi',
    cityName: '黄石',
    province: '湖北',
    cityLat: 30.2012,
    cityLng: 115.0182,
    stations: [
      { id: 'st-hs-main', name: '黄石站', lat: 30.2012, lng: 115.0182 },
      { id: 'st-hs-north', name: '黄石北站', lat: 30.2285, lng: 115.0428 },
      { id: 'st-hs-daye', name: '大冶北站', lat: 30.1288, lng: 114.9812 },
    ],
  },
  {
    id: 'city-shiyan',
    cityName: '十堰',
    province: '湖北',
    cityLat: 32.647,
    cityLng: 110.798,
    stations: [
      { id: 'st-sy-shiyandong', name: '十堰东站', lat: 32.6688, lng: 110.8588 },
      { id: 'st-sy-shiyan', name: '十堰站', lat: 32.6388, lng: 110.7888 },
      { id: 'st-sy-danjiangkou', name: '丹江口站', lat: 32.5512, lng: 111.5128 },
      { id: 'st-sy-wudangshan', name: '武当山西站', lat: 32.5382, lng: 111.0852 },
    ],
  },
  {
    id: 'city-yichang',
    cityName: '宜昌',
    province: '湖北',
    cityLat: 30.692,
    cityLng: 111.286,
    stations: [
      { id: 'st-yc-yichangdong', name: '宜昌东站', lat: 30.6688, lng: 111.3688 },
      { id: 'st-yc-main', name: '宜昌站', lat: 30.6985, lng: 111.2912 },
      { id: 'st-yc-dangyang', name: '当阳站', lat: 30.8212, lng: 111.7852 },
      { id: 'st-yc-zhijiang', name: '枝江北站', lat: 30.4482, lng: 111.7612 },
    ],
  },
  {
    id: 'city-xiangyang',
    cityName: '襄阳',
    province: '湖北',
    cityLat: 32.009,
    cityLng: 112.122,
    stations: [
      { id: 'st-xy-xiangyangdong', name: '襄阳东站', lat: 32.0288, lng: 112.2288 },
      { id: 'st-xy-xiangyang', name: '襄阳站', lat: 32.0488, lng: 112.1488 },
      { id: 'st-xy-xiangzhou', name: '襄州站', lat: 32.0912, lng: 112.1852 },
      { id: 'st-xy-zaoyang', name: '枣阳站', lat: 32.1312, lng: 112.7682 },
    ],
  },
  {
    id: 'city-ezhou',
    cityName: '鄂州',
    province: '湖北',
    cityLat: 30.3882,
    cityLng: 114.8912,
    stations: [
      { id: 'st-[#52c488]-main', name: '鄂州站', lat: 30.3882, lng: 114.8912 },
      { id: 'st-[#52c488]-east', name: '鄂州东站', lat: 30.3712, lng: 114.9218 },
      { id: 'st-[#52c488]-huahu', name: '花湖机场站', lat: 30.3182, lng: 115.0312 },
    ],
  },
  {
    id: 'city-jingmen',
    cityName: '荆门',
    province: '湖北',
    cityLat: 31.0358,
    cityLng: 112.2028,
    stations: [
      { id: 'st-jm-main', name: '荆门站', lat: 31.0358, lng: 112.2028 },
      { id: 'st-jm-west', name: '荆门西站', lat: 31.0218, lng: 112.1612 },
      { id: 'st-jm-zhongxiang', name: '钟祥站', lat: 31.1682, lng: 112.5852 },
    ],
  },
  {
    id: 'city-xiaogan',
    cityName: '孝感',
    province: '湖北',
    cityLat: 30.9282,
    cityLng: 113.9218,
    stations: [
      { id: 'st-[#52c488]g-main', name: '孝感站', lat: 30.9282, lng: 113.9218 },
      { id: 'st-[#52c488]g-east', name: '孝感东站', lat: 30.9128, lng: 113.9582 },
      { id: 'st-[#52c488]g-north', name: '孝感北站', lat: 31.3288, lng: 113.9852 },
      { id: 'st-[#52c488]g-yingcheng', name: '应城站', lat: 30.9312, lng: 113.5812 },
    ],
  },
  {
    id: 'city-jingzhou',
    cityName: '荆州',
    province: '湖北',
    cityLat: 30.3582,
    cityLng: 112.2185,
    stations: [
      { id: 'st-jz-main', name: '荆州站', lat: 30.3582, lng: 112.2185 },
      { id: 'st-jz-songzi', name: '松滋站', lat: 30.1712, lng: 111.7582 },
      { id: 'st-jz-shishou', name: '石首站', lat: 29.7212, lng: 112.4218 },
    ],
  },
  {
    id: 'city-huanggang',
    cityName: '黄冈',
    province: '湖北',
    cityLat: 30.4418,
    cityLng: 114.8821,
    stations: [
      { id: 'st-hg-main', name: '黄冈站', lat: 30.4418, lng: 114.8821 },
      { id: 'st-hg-east', name: '黄冈东站', lat: 30.4285, lng: 114.9218 },
      { id: 'st-hg-west', name: '黄冈西站', lat: 30.4582, lng: 114.8512 },
      { id: 'st-hg-macheng', name: '麻城北站', lat: 31.2012, lng: 115.0218 },
    ],
  },
  {
    id: 'city-xianning',
    cityName: '咸宁',
    province: '湖北',
    cityLat: 29.8512,
    cityLng: 114.3218,
    stations: [
      { id: 'st-xn-main', name: '咸宁站', lat: 29.8512, lng: 114.3218 },
      { id: 'st-xn-north', name: '咸宁北站', lat: 29.8912, lng: 114.3482 },
      { id: 'st-xn-south', name: '咸宁南站', lat: 29.8218, lng: 114.3128 },
      { id: 'st-xn-chibi', name: '赤壁北站', lat: 29.7282, lng: 113.8852 },
    ],
  },
  {
    id: 'city-suizhou',
    cityName: '随州',
    province: '湖北',
    cityLat: 31.69,
    cityLng: 113.3828,
    stations: [
      { id: 'st-sz-suizhounan', name: '随州南站', lat: 31.6588, lng: 113.3988 },
      { id: 'st-sz-suizhou', name: '随州站', lat: 31.7088, lng: 113.3788 },
      { id: 'st-sz-guangshui', name: '广水站', lat: 31.6218, lng: 113.8218 },
    ],
  },
  {
    id: 'city-enshi',
    cityName: '恩施',
    province: '湖北',
    cityLat: 30.3182,
    cityLng: 109.4882,
    stations: [
      { id: 'st-es-main', name: '恩施站', lat: 30.3182, lng: 109.4882 },
      { id: 'st-es-lichuan', name: '利川站', lat: 30.2982, lng: 108.9382 },
      { id: 'st-es-jianshi', name: '建始站', lat: 30.6012, lng: 109.7182 },
    ],
  },
  {
    id: 'city-xiantao',
    cityName: '仙桃',
    province: '湖北',
    cityLat: 30.3412,
    cityLng: 113.4512,
    stations: [
      { id: 'st-xt-main', name: '仙桃站', lat: 30.3412, lng: 113.4512 },
      { id: 'st-xt-west', name: '仙桃西站', lat: 30.2912, lng: 113.1852 },
    ],
  },
  {
    id: 'city-qianjiang',
    cityName: '潜江',
    province: '湖北',
    cityLat: 30.3882,
    cityLng: 112.8982,
    stations: [
      { id: 'st-qj-main', name: '潜江站', lat: 30.3882, lng: 112.8982 },
    ],
  },
  {
    id: 'city-tianmen',
    cityName: '天门',
    province: '湖北',
    cityLat: 30.6882,
    cityLng: 113.1218,
    stations: [
      { id: 'st-tm-south', name: '天门南站', lat: 30.3182, lng: 113.1852 },
      { id: 'st-tm-main', name: '天门站', lat: 30.6882, lng: 113.1218 },
      { id: 'st-tm-north', name: '天门北站', lat: 30.7182, lng: 113.1482 },
    ],
  },
  {
    id: 'city-shennongjia',
    cityName: '神农架',
    province: '湖北',
    cityLat: 31.7482,
    cityLng: 110.6782,
    stations: [
      { id: 'st-snj-main', name: '神农架站', lat: 31.7482, lng: 110.6782 },
    ],
  },

  // 其他主要省市及铁路枢纽
  {
    id: 'city-beijing',
    cityName: '北京',
    province: '北京',
    cityLat: 39.9042,
    cityLng: 116.4074,
    stations: [
      { id: 'st-bj-main', name: '北京站', lat: 39.9029, lng: 116.4271 },
      { id: 'st-bj-west', name: '北京西站', lat: 39.8949, lng: 116.3222 },
      { id: 'st-bj-south', name: '北京南站', lat: 39.8652, lng: 116.3785 },
      { id: 'st-bj-north', name: '北京北站', lat: 39.9419, lng: 116.3533 },
      { id: 'st-bj-qinghe', name: '清河站', lat: 40.0298, lng: 116.3314 },
      { id: 'st-bj-chaoyang', name: '北京朝阳站', lat: 39.9538, lng: 116.5029 },
    ],
  },
  {
    id: 'city-shanghai',
    cityName: '上海',
    province: '上海',
    cityLat: 31.2304,
    cityLng: 121.4737,
    stations: [
      { id: 'st-sh-hongqiao', name: '上海虹桥站', lat: 31.1945, lng: 121.3204 },
      { id: 'st-sh-main', name: '上海站', lat: 31.2497, lng: 121.4557 },
      { id: 'st-sh-south', name: '上海南站', lat: 31.1539, lng: 121.4296 },
      { id: 'st-sh-west', name: '上海西站', lat: 31.2618, lng: 121.4011 },
    ],
  },
  {
    id: 'city-guangzhou',
    cityName: '广州',
    province: '广东',
    cityLat: 23.1291,
    cityLng: 113.2644,
    stations: [
      { id: 'st-gz-south', name: '广州南站', lat: 22.9889, lng: 113.2688 },
      { id: 'st-gz-main', name: '广州站', lat: 23.1486, lng: 113.2578 },
      { id: 'st-gz-east', name: '广州东站', lat: 23.1498, lng: 113.3248 },
      { id: 'st-gz-baiyun', name: '广州白云站', lat: 23.1878, lng: 113.2562 },
    ],
  },
  {
    id: 'city-shenzhen',
    cityName: '深圳',
    province: '广东',
    cityLat: 22.5431,
    cityLng: 114.0579,
    stations: [
      { id: 'st-sz-north', name: '深圳北站', lat: 22.6098, lng: 114.0298 },
      { id: 'st-sz-main', name: '深圳站', lat: 22.5323, lng: 114.1179 },
      { id: 'st-sz-futian', name: '福田站', lat: 22.5367, lng: 114.0558 },
    ],
  },
  {
    id: 'city-hangzhou',
    cityName: '杭州',
    province: '浙江',
    cityLat: 30.2741,
    cityLng: 120.1551,
    stations: [
      { id: 'st-hz-east', name: '杭州东站', lat: 30.2908, lng: 120.2131 },
      { id: 'st-hz-main', name: '杭州站', lat: 30.2464, lng: 120.1802 },
      { id: 'st-hz-south', name: '杭州南站', lat: 30.1708, lng: 120.2721 },
      { id: 'st-hz-west', name: '杭州西站', lat: 30.2788, lng: 119.9608 },
    ],
  },
  {
    id: 'city-chengdu',
    cityName: '成都',
    province: '四川',
    cityLat: 30.5728,
    cityLng: 104.0668,
    stations: [
      { id: 'st-cd-east', name: '成都东站', lat: 30.6288, lng: 104.1412 },
      { id: 'st-cd-south', name: '成都南站', lat: 30.6038, lng: 104.0678 },
      { id: 'st-cd-west', name: '成都西站', lat: 30.6728, lng: 103.9688 },
      { id: 'st-cd-main', name: '成都站', lat: 30.6978, lng: 104.0728 },
    ],
  },
  {
    id: 'city-nanjing',
    cityName: '南京',
    province: '江苏',
    cityLat: 32.0603,
    cityLng: 118.7969,
    stations: [
      { id: 'st-nj-south', name: '南京南站', lat: 31.9688, lng: 118.7958 },
      { id: 'st-nj-main', name: '南京站', lat: 32.0888, lng: 118.7988 },
    ],
  },
  {
    id: 'city-xian',
    cityName: '西安',
    province: '陕西',
    cityLat: 34.3416,
    cityLng: 108.9398,
    stations: [
      { id: 'st-xa-north', name: '西安北站', lat: 34.3758, lng: 108.9388 },
      { id: 'st-xa-main', name: '西安站', lat: 34.2788, lng: 108.9612 },
    ],
  },
  {
    id: 'city-chongqing',
    cityName: '重庆',
    province: '重庆',
    cityLat: 29.563,
    cityLng: 106.5516,
    stations: [
      { id: 'st-cq-north', name: '重庆北站', lat: 29.6058, lng: 106.5512 },
      { id: 'st-cq-west', name: '重庆西站', lat: 29.5218, lng: 106.4258 },
      { id: 'st-cq-main', name: '重庆站', lat: 29.5488, lng: 106.5488 },
    ],
  },
  {
    id: 'city-changsha',
    cityName: '长沙',
    province: '湖南',
    cityLat: 28.2282,
    cityLng: 112.9388,
    stations: [
      { id: 'st-cs-south', name: '长沙南站', lat: 28.1488, lng: 113.0658 },
      { id: 'st-cs-main', name: '长沙站', lat: 28.1958, lng: 113.0128 },
    ],
  },
  {
    id: 'city-zhengzhou',
    cityName: '郑州',
    province: '河南',
    cityLat: 34.7466,
    cityLng: 113.6253,
    stations: [
      { id: 'st-zz-east', name: '郑州东站', lat: 34.7588, lng: 113.7788 },
      { id: 'st-zz-main', name: '郑州站', lat: 34.7488, lng: 113.6588 },
    ],
  },
  {
    id: 'city-hefei',
    cityName: '合肥',
    province: '安徽',
    cityLat: 31.8206,
    cityLng: 117.2272,
    stations: [
      { id: 'st-hf-south', name: '合肥南站', lat: 31.7988, lng: 117.2888 },
      { id: 'st-hf-main', name: '合肥站', lat: 31.8888, lng: 117.3188 },
    ],
  },
  {
    id: 'city-suzhou-js',
    cityName: '苏州',
    province: '江苏',
    cityLat: 31.2989,
    cityLng: 120.5853,
    stations: [
      { id: 'st-suzh-main', name: '苏州站', lat: 31.3288, lng: 120.6088 },
      { id: 'st-suzh-north', name: '苏州北站', lat: 31.4188, lng: 120.6412 },
      { id: 'st-suzh-park', name: '苏州园区站', lat: 31.3312, lng: 120.7188 },
    ],
  },
  {
    id: 'city-qingdao',
    cityName: '青岛',
    province: '山东',
    cityLat: 36.0671,
    cityLng: 120.3826,
    stations: [
      { id: 'st-qd-main', name: '青岛站', lat: 36.0628, lng: 120.3128 },
      { id: 'st-qd-north', name: '青岛北站', lat: 36.1688, lng: 120.3788 },
    ],
  },
  {
    id: 'city-xiamen',
    cityName: '厦门',
    province: '福建',
    cityLat: 24.4798,
    cityLng: 118.0894,
    stations: [
      { id: 'st-xm-main', name: '厦门站', lat: 24.4688, lng: 118.1188 },
      { id: 'st-xm-north', name: '厦门北站', lat: 24.6388, lng: 118.0688 },
    ],
  },
];

