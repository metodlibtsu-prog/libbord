import { useTheme } from '@/context/ThemeContext'

export interface ChartTheme {
  gridColor: string
  textColor: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
  cursorFill: string
  legendColor: string
  lineColors: string[]
}

export function useChartTheme(): ChartTheme {
  const { isDark } = useTheme()

  return {
    gridColor:     isDark ? '#30363D' : '#E5E7EB',
    textColor:     isDark ? '#8B949E' : '#64748B',
    tooltipBg:     isDark ? '#161B22' : '#FFFFFF',
    tooltipBorder: isDark ? '#30363D' : '#E2E8F0',
    tooltipText:   isDark ? '#E6EDF3' : '#0F172A',
    cursorFill:    isDark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(37, 99, 235, 0.05)',
    legendColor:   isDark ? '#8B949E' : '#475569',
    lineColors: isDark
      ? ['#00D4FF', '#7B2FBE', '#FF006E', '#10B981', '#F59E0B', '#0EA5E9']
      : ['#2563EB', '#0891B2', '#7C3AED', '#16A34A', '#D97706', '#0284C7'],
  }
}
