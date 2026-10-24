export function actionLink(action) {
  try {
    const url = new URL(String(action.actionUrl ?? '').trim());
    const method = action.openMethod ?? 'external_browser';
    if (!['in_app_browser','external_browser','deep_link'].includes(method)) return null;
    const web = ['http:', 'https:'].includes(url.protocol);
    const deep = method === 'deep_link';
    if (!web && (!deep || ['javascript:', 'data:', 'file:', 'blob:', 'about:', 'chrome:', 'chrome-extension:', 'devtools:', 'view-source:', 'filesystem:', 'resource:', 'edge:', 'vbscript:'].includes(url.protocol))) return null;
    return { url: url.href, method, title: url.hostname || url.protocol };
  } catch { return null; }
}

export function customCheckoutLink(action, {packageId,appUserId,environment}={}) {
  const link=actionLink(action);
  if(!link||!['external_browser','deep_link'].includes(link.method))return null;
  const url=new URL(link.url);
  for(const [enabled,key,value] of [[action.attachPackageId,'rc_package',packageId],[action.attachAppUserId,'rc_app_user_id',appUserId],[action.attachEnvironment,'rc_env',environment]]) {
    if(enabled!==false&&value!==undefined&&value!==null&&value!=='')url.searchParams.set(key,value);
  }
  return {...link,url:url.href};
}
