// 브라우저 알림 (지침서 5-3)

export async function askPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'default') {
    return await Notification.requestPermission()
  }
  return Notification.permission
}

export function permissionState() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export function boomSoon(content) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const n = new Notification('10초 뒤 터집니다', {
    body: content,
    tag: 'boomb-soon', // 같은 태그 → 쌓이지 않고 교체
  })
  n.onclick = () => {
    window.focus()
    location.href = '/'
  }
}
