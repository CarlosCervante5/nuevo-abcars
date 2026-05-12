import { useState } from 'react'

type Props = {
  beforeSrc: string
  afterSrc: string | null
  statusLine: string
  isLoading: boolean
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  statusLine,
  isLoading,
}: Props) {
  const [pos, setPos] = useState(50)

  if (!afterSrc) {
    return (
      <div className="compare">
        <div className="compare__viewport compare__viewport--pending">
          <img src={beforeSrc} alt="" className="compare__after" />
          {isLoading ? (
            <div className="compare__overlay">
              <span className="spinner spinner--dark" aria-hidden />
            </div>
          ) : null}
        </div>
        <p className="compare__status">{statusLine}</p>
      </div>
    )
  }

  return (
    <div className="compare">
      <div className="compare__viewport">
        <img src={afterSrc} alt="" className="compare__after" />
        <div
          className="compare__before-mask"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img src={beforeSrc} alt="" className="compare__before" />
        </div>
        <div
          className="compare__handle"
          style={{ left: `${pos}%` }}
          aria-hidden
        />
        <div className="compare__badges">
          <span className="compare__badge">Antes</span>
          <span className="compare__badge compare__badge--after">Después</span>
        </div>
      </div>
      <label className="compare__range-wrap">
        <span className="compare__sr-only">Deslizar para comparar antes y después</span>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="compare__range"
        />
      </label>
    </div>
  )
}
