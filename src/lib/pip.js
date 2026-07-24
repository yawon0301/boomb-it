// 떠 있는 창 (Document Picture-in-Picture) — 지침서 5-2
// ⚠ 반드시 사용자 클릭 핸들러 안에서 호출해야 합니다.

export function pipSupported() {
  return 'documentPictureInPicture' in window
}

export async function openFloat() {
  if (!pipSupported()) {
    throw new Error('이 브라우저는 떠 있는 창(PiP)을 지원하지 않습니다. Chrome/Edge를 권장합니다.')
  }

  // 원래 크기(가로형) 고정 — 안에서 메모를 같은 크기 타일로 배치
  const pip = await window.documentPictureInPicture.requestWindow({
    width: 460,
    height: 300,
  })

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
