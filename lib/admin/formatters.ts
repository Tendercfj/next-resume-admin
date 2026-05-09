export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00.000Z`))
}

export function formatDateRange(
  startDate: string,
  endDate: string,
  options?: {
    currentLabel?: string
    emptyLabel?: string
  }
) {
  const currentLabel = options?.currentLabel ?? "至今"
  const emptyLabel = options?.emptyLabel ?? "未设置时间"

  if (!startDate && !endDate) {
    return emptyLabel
  }

  if (!startDate) {
    return `${emptyLabel} - ${formatDate(endDate)}`
  }

  if (!endDate) {
    return `${formatDate(startDate)} - ${currentLabel}`
  }

  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}
