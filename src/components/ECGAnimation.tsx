// components/ECGAnimation.tsx
import { useEffect, useRef } from 'react'


interface ECGAnimationProps {
  width?: number | string
  height?: number
  showLetters?: boolean
  speed?: number
  color?: string
  className?: string
  onComplete?: () => void
}


const DEFAULT_COLOR = '#5B8C8F'
const DEFAULT_COLOR_LIGHT = '#8BAFB1'
const DEFAULT_COLOR_DARK = '#4A7679'

export const ECGAnimation = ({
  width = '100%',
  height = 110,
  showLetters = true,
  speed = 0.30,
  color = DEFAULT_COLOR,
  className = '',
  onComplete,
}: ECGAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    const maxW = parent ? parent.clientWidth - 48 : 260
    const W = typeof width === 'number' ? width : Math.min(Math.max(maxW, 180), 480)
    const H = height
    const dpr = window.devicePixelRatio || 1

    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    canvas.style.maxWidth = '100%'

    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    const cy = 46
    const colors = [color, DEFAULT_COLOR_LIGHT, DEFAULT_COLOR_DARK, DEFAULT_COLOR_LIGHT]

    type Pt = [number, number]
    interface Seg { pts: Pt[]; l: string; col: string }

    const buildSegs = (): Seg[] => {
      const list: Seg[] = []
      let x = 0
      const flat = (n: number, a: Pt[]) => {
        for (let i = 0; i < n; i++) {
          a.push([x, cy])
          x++
        }
      }
      const sp = (up: number, dn: number, a: Pt[]) => {
        a.push([x++, cy])
        a.push([x++, cy - up * 0.3])
        a.push([x++, cy + dn * 0.1])
        a.push([x++, cy - up])
        a.push([x++, cy + dn])
        a.push([x++, cy - dn * 0.06])
        a.push([x++, cy])
      }
      const skip = (n: number) => {
        x += n
      }

      // C
      const c: Pt[] = []
      flat(4, c)
      for (let i = 0; i < 12; i++) {
        c.push([x, cy - Math.sin((i / 11) * Math.PI) * 32])
        x++
      }
      flat(4, c)
      list.push({ pts: c, l: 'C', col: '#4A6B6E' })
      skip(7)

      // U
      const u: Pt[] = []
      flat(3, u)
      sp(36, 14, u)
      flat(3, u)
      sp(36, 14, u)
      flat(3, u)
      list.push({ pts: u, l: 'U', col: colors[1] })
      skip(7)

      // R
      const r: Pt[] = []
      flat(3, r)
      sp(40, 13, r)
      flat(3, r)
      sp(22, 8, r)
      flat(3, r)
      list.push({ pts: r, l: 'R', col: colors[2] })
      skip(7)

      // A
      const a: Pt[] = []
      flat(3, a)
      sp(44, 17, a)
      for (let i = 6; i >= 0; i--) {
        a.push([x, cy - i * 4.5])
        x++
      }
      flat(3, a)
      sp(22, 10, a)
      flat(3, a)
      list.push({ pts: a, l: 'A', col: colors[3] })

      return list
    }

    const sg = buildSegs()
    const all: Pt[] = sg.flatMap(s => s.pts)
    const mx = all[all.length - 1][0]
    const scX = (W - 30) / mx,
      oX = 15
    const ppx = (p: Pt) => p[0] * scX + oX
    const ppy = (p: Pt) => p[1]
    const ss = (si: number) => sg.slice(0, si).reduce((s, g) => s + g.pts.length, 0)
    const cx2 = (seg: Seg) => {
      const xs = seg.pts.map(ppx)
      return (Math.min(...xs) + Math.max(...xs)) / 2
    }

    let prog = 0
    const spd = speed

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      sg.forEach((seg, si) => {
        const st = ss(si),
          en = st + seg.pts.length
        const ve = Math.min(Math.floor(prog), en)
        const vp = all.slice(st, ve)
        if (vp.length < 2) return

        ctx.save()
        ctx.strokeStyle = 'rgba(91,140,143,0.08)'
        ctx.lineWidth = 8
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(ppx(vp[0]), ppy(vp[0]))
        vp.forEach(p => ctx.lineTo(ppx(p), ppy(p)))
        ctx.stroke()
        ctx.restore()

        ctx.save()
        ctx.strokeStyle = seg.col
        ctx.lineWidth = 2
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(ppx(vp[0]), ppy(vp[0]))
        vp.forEach(p => ctx.lineTo(ppx(p), ppy(p)))
        ctx.stroke()
        ctx.restore()

        if (showLetters) {
          const sp2 = Math.min(1, (Math.floor(prog) - st) / seg.pts.length)
          if (sp2 > 0) {
            const c3 = cx2(seg),
              al = Math.min(sp2 * 4, 1)
            ctx.save()
            ctx.globalAlpha = al * 0.2
            ctx.strokeStyle = seg.col
            ctx.lineWidth = 1
            ctx.setLineDash([2, 3])
            ctx.beginPath()
            ctx.moveTo(c3, cy + 4)
            ctx.lineTo(c3, H - 18)
            ctx.stroke()
            ctx.restore()

            ctx.save()
            ctx.globalAlpha = al
            ctx.font = '700 13px Syne, sans-serif'
            ctx.fillStyle = seg.col
            ctx.textAlign = 'center'
            ctx.fillText(seg.l, c3, H - 4)
            ctx.restore()
          }
        }
      })

      const di = Math.min(Math.floor(prog) - 1, all.length - 1)
      if (di >= 0 && Math.floor(prog) < all.length) {
        const gx = ppx(all[di]),
          gy = ppy(all[di])
        ctx.save()
        ctx.beginPath()
        ctx.arc(gx, gy, 3, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.restore()

        ctx.save()
        ctx.beginPath()
        ctx.arc(gx, gy, 6, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(91,140,143,0.3)'
        ctx.lineWidth = 1.2
        ctx.stroke()
        ctx.restore()
      }

      if (Math.floor(prog) < all.length) {
        prog += spd
        animationRef.current = requestAnimationFrame(draw)
      } else {
        prog = 0
        if (onComplete) onComplete()
        setTimeout(() => {
          if (animationRef.current) {
            draw()
          }
        }, 3000)
      }
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [width, height, showLetters, speed, color, onComplete])

  return (
    <canvas
      ref={canvasRef}
      className={`ecg-animation ${className}`}
      style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 8 }}
    />
  )
}

export default ECGAnimation