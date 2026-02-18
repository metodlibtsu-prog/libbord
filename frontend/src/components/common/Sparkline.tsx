interface Props {
  data: number[]
  color: string
  className?: string
}

export default function Sparkline({ data, color, className = '' }: Props) {
  if (data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg className={`w-full h-full ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <polygon points={`0,100 ${points} 100,100`} fill={`url(#gradient-${color})`} />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots on hover */}
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = 100 - ((value - min) / range) * 100
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2"
            fill={color}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        )
      })}
    </svg>
  )
}
