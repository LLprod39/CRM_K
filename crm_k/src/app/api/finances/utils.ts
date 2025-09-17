export function buildDateRange(params: URLSearchParams) {
  const period = params.get('period') || 'all'
  const startParam = params.get('startDate')
  const endParam = params.get('endDate')

  const range: { gte?: Date; lte?: Date } = {}
  const now = new Date()

  if (period === 'day') {
    range.gte = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (period === 'week') {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    range.gte = weekStart
  } else if (period === 'month') {
    range.gte = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  if (startParam) {
    const parsed = new Date(startParam)
    if (!isNaN(parsed.getTime())) {
      range.gte = parsed
    }
  }

  if (endParam) {
    const parsed = new Date(endParam)
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(23, 59, 59, 999)
      range.lte = parsed
    }
  }

  return range
}
