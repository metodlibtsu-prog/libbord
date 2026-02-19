import { useTheme } from '@/context/ThemeContext'

export interface ChartTheme {
  gridColor: string
  textColor: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
  cursorFill: string
  legendColor: string
}

export function useChartTheme(): ChartTheme {
  const { isDark } = useTheme()

  return {
    gridColor:     isDark ? '#30363D' : '#E2E8F0',
    textColor:     isDark ? '#8B949E' : '#64748B',
    tooltipBg:     isDark ? '#161B22' : '#FFFFFF',
    tooltipBorder: isDark ? '#30363D' : '#E2E8F0',
    tooltipText:   isDark ? '#E6EDF3' : '#0F172A',
    cursorFill:    isDark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(0, 212, 255, 0.05)',
    legendColor:   isDark ? '#8B949E' : '#64748B',
  }
}
