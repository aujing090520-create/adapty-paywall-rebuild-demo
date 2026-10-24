export const iconAliases={check:'勾选',lock:'锁',icons:'图形图标',star:'星标',heart:'爱心',bell:'铃铛',moon:'月亮',gift:'礼物',clock:'时钟',users:'用户组',flower:'花朵',map:'地图',activity:'活动',ticket:'票券',download:'下载',archive:'归档',shirt:'衣服',scan:'扫描',home:'首页',search:'搜索',settings:'设置',x:'关闭',plus:'添加',minus:'减少',circle:'圆形',square:'方形','circle-check':'圆形勾选','circle-x':'圆形关闭','arrow-right':'向右箭头','arrow-left':'向左箭头','arrow-up':'向上箭头','arrow-down':'向下箭头',crown:'皇冠',diamond:'钻石',award:'奖章',trophy:'奖杯',world:'地球',language:'语言',book:'书本',message:'消息',phone:'电话',camera:'相机',photo:'图片',video:'视频',player:'播放',volume:'音量',microphone:'麦克风'};

export function iconLabel(value,legacyNames={}){
  if(legacyNames[value])return legacyNames[value];
  const match=/^tabler:(outline|filled):([a-z0-9-]+)$/.exec(value??'');
  return match?`${match[1]==='filled'?'填充':'线框'} · ${iconAliases[match[2]]??match[2]}`:value??'';
}
