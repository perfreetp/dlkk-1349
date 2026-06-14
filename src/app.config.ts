export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/rank/index',
    'pages/submit/index',
    'pages/mine/index',
    'pages/detail/index',
    'pages/filter/index',
    'pages/comment/index',
    'pages/checkin/index',
    'pages/map/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#5B8FF9',
    navigationBarTitleText: '校园宝藏',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#5B8FF9',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/rank/index',
        text: '榜单'
      },
      {
        pagePath: 'pages/submit/index',
        text: '投稿'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
