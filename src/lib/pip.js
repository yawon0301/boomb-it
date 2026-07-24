// 떠 있는 창 (Document Picture-in-Picture) — 지침서 5-2
// ⚠ 반드시 사용자 클릭 핸들러 안에서 호출해야 합니다.

export function pipSupported() {
  return 'documentPictureInPicture' in window
}

// 메모 개수에 맞춰 창 크기 계산 — 모든 타일이 한눈에 보이도록
// 타일은 같은 비율(같은 크기)로 그리드 배치되며, 최대 4열까지 가로로 늘린 뒤 줄바꿈
const TILE_W = 200
const TILE_H = 184
const MAX_COLS = 4

export function floatGrid(count = 1) {
  const n = Math.max(1, count)
  const cols = Math.min(n, MAX_COLS)
  const rows = Math.ceil(n / cols)
  return { cols, rows }
}

export function floatSize(count = 1) {
  const { cols, rows } = floatGrid(count)
  const availW = window.screen?.availWidth || 1280
  const availH = window.screen?.availHeight || 800
  const width = Math.max(320, Math.min(cols * TILE_W, Math.floor(availW * 0.9)))
  const height = Math.max(200, Math.min(rows * TILE_H, Math.floor(availH * 0.9)))
  return { width, height }
}

export async function openFloat(count = 1) {
  if (!pipSupported()) {
    throw new Error('이 브라우저는 떠 있는 창(PiP)을 지원하지 않습니다. Chrome/Edge를 권장합니다.')
  }

  // 메모 개수에 맞춘 크기로 — 모든 타일이 보이도록 자동 비율
  const { width, height } = floatSize(count)
  const pip = await window.documentPictureInPicture.requestWindow({ width, height })

  // ⚠ 이 복사가 없으면 떠 있는 창에서 Tailwind가 전혀 안 먹습니다 (지침서 함정 2)
  for (const sheet of document.styleSheets) {
    try {
      const css = [...sheet.cssRules].map((r) => r.cssText).join('')
      const style = document.createElement('style')
      style.textContent = css
      pip.document.head.appendChild(style)
    } catch {
      if (sheet.href) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = sheet.href
        pip.document.head.appendChild(link)
      }
    }
  }

  // 배경색(폭탄 상태색)이 창 전체를 채우도록 html/body를 100% 높이로
  pip.document.documentElement.style.height = '100%'
  pip.document.body.style.height = '100%'
  pip.document.body.style.margin = '0'
  pip.document.body.style.background = '#ffffff'
  return pip
}
