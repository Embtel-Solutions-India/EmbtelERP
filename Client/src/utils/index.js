import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns'

export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)

export const formatNumber = (n) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

export const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d && !isNaN(d.getTime()) ? format(d, 'MMM dd, yyyy') : '-'
}

export const formatTime = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d && !isNaN(d.getTime()) ? format(d, 'hh:mm a') : '-'
}

export const formatDateTime = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d && !isNaN(d.getTime()) ? format(d, 'MMM dd, yyyy hh:mm a') : '-'
}

export const timeAgo = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d && !isNaN(d.getTime()) ? formatDistanceToNow(d, { addSuffix: true }) : '-'
}

export const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export const getDueBadge = (dateStr) => {
  const d = new Date(dateStr)
  if (isPast(d) && !isToday(d)) return { label: 'Overdue', color: 'error' }
  if (isToday(d)) return { label: 'Today', color: 'warning' }
  if (isTomorrow(d)) return { label: 'Tomorrow', color: 'info' }
  return { label: formatDate(d), color: 'default' }
}

export const getPriorityColor = (priority) => {
  const map = { hot: '#ef4444', warm: '#f59e0b', cold: '#06b6d4', high: '#ef4444', medium: '#f59e0b', low: '#10b981', urgent: '#7c3aed' }
  return map[priority?.toLowerCase()] || '#6366f1'
}

export const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

export const clsx = (...classes) => classes.filter(Boolean).join(' ')
