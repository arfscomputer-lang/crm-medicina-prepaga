'use client'

import React from 'react'

const ICON_PATHS: Record<string, string> = {
  Home:          'M3 12 12 3l9 9M5 10v10h14V10',
  Users:         'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0ZM2 21v-2a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v2',
  ShieldCheck:   'M12 2 4 5v7c0 5 3.5 9 8 10 4.5-1 8-5 8-10V5l-8-3Z|m9 12 2 2 4-4',
  BookOpen:      'M2 3h7a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-7a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h8z',
  DollarSign:    'M12 2v20M17 6H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6',
  Activity:      'M3 12h4l3-9 4 18 3-9h4',
  MessageCircle: 'M21 12a8.5 8.5 0 0 1-12.6 7.5L3 21l1.5-5.4A8.5 8.5 0 1 1 21 12Z',
  MessageSquare: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  Settings:      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z|M19.4 15a1.7 1.7 0 0 0 .4 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.4 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .4-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.4h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.4 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z',
  Plus:          'M12 5v14M5 12h14',
  Search:        'M11 11a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-4.3-4.3',
  Filter:        'M22 3H2l8 9.5V21l4-2v-6.5z',
  ChevronDown:   'm6 9 6 6 6-6',
  ChevronUp:     'm6 15 6-6 6 6',
  ChevronRight:  'm9 6 6 6-6 6',
  ChevronLeft:   'm15 6-6 6 6 6',
  ChevronsUpDown:'m7 15 5 5 5-5|m7 9 5-5 5 5',
  ArrowUp:       'M12 19V5M5 12l7-7 7 7',
  ArrowDown:     'M12 5v14M5 12l7 7 7-7',
  ArrowRight:    'M5 12h14M12 5l7 7-7 7',
  MoreHorizontal:'M12 12h.01M19 12h.01M5 12h.01',
  MoreVertical:  'M12 12h.01M12 5h.01M12 19h.01',
  X:             'M18 6 6 18M6 6l12 12',
  Check:         'M20 6 9 17l-5-5',
  Download:      'M12 3v12m0 0-4-4m4 4 4-4M5 21h14',
  Upload:        'M12 21V9m0 0-4 4m4-4 4 4M5 3h14',
  Edit:          'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7|m18.5 2.5 3 3-11 11H7.5v-3Z',
  Trash:         'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  Copy:          'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2|M8 16V6a2 2 0 0 1 2-2h6v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2',
  Bell:          'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9|M10.3 21a1.94 1.94 0 0 0 3.4 0',
  AlertTriangle: 'M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z|M12 9v4M12 17h.01',
  AlertCircle:   'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z|M12 8v4M12 16h.01',
  Info:          'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z|M12 16v-4M12 8h.01',
  CheckCircle:   'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z|m9 12 2 2 4-4',
  Clock:         'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z|M12 6v6l4 2',
  Calendar:      'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 9h18M8 3v4M16 3v4',
  TrendingUp:    'm22 7-8.5 8.5-5-5L2 17|M16 7h6v6',
  TrendingDown:  'm22 17-8.5-8.5-5 5L2 7|M16 17h6v-6',
  Phone:         'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.7a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1-1.2a2 2 0 0 1 2-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z',
  Mail:          'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z|m22 7-10 6L2 7',
  FileText:      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8',
  Star:          'M12 2 15.1 8.3 22 9.3l-5 4.9 1.2 6.9L12 17.8l-6.2 3.3L7 14.2 2 9.3l6.9-1z',
  Shield:        'M12 22S20 18 20 12V5l-8-3-8 3v7c0 6 8 10 8 10z',
  Eye:           'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z|M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  EyeOff:        'm2 2 20 20|M6.7 6.7A10.5 10.5 0 0 0 2 12s3.5 7 10 7c2 0 3.6-.6 5-1.4|M9.9 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3 4|M10 10.7a3 3 0 0 0 4 4',
  LogOut:        'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|m16 17 5-5-5-5|M21 12H9',
  Send:          'm22 2-7 20-4-9-9-4z|M22 2 11 13',
  Building:      'M3 21h18|M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16|M9 7h.01M9 11h.01M9 15h.01M15 7h.01M15 11h.01M15 15h.01',
  Lock:          'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z|M7 11V7a5 5 0 0 1 10 0v4',
  QrCode:        'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3zM14 18h1M18 14h1',
  CreditCard:    'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20',
  PieChart:      'M21.2 15A10 10 0 1 1 9 2.8|M22 12A10 10 0 0 0 12 2v10z',
  Zap:           'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  RefreshCw:     'M21 12a9 9 0 0 0-15-6.7L3 8|M3 4v4h4|M3 12a9 9 0 0 0 15 6.7l3-2.7|M21 20v-4h-4',
  Megaphone:     'm3 11 18-5v12L3 14v-3z|M11.6 16.8a3 3 0 1 1-5.8-1.6',
  ListChecks:    'M3 6h.01M3 12h.01M3 18h.01|M8 6h13|M8 12h13|M8 18h13',
  Layers:        'm12 2 10 6-10 6L2 8z|m2 14 10 6 10-6|m2 11 10 6 10-6',
  Palette:       'M12 22A10 10 0 1 1 22 12c0 2-1.6 3.6-3.6 3.6H17a2 2 0 0 0-2 2 2 2 0 0 0 .4 1.2 2 2 0 0 1-1.6 3.2|M13.5 6.5h.01|M17.5 10.5h.01|M8.5 7.5h.01|M6.5 12.5h.01',
  GripVertical:  'M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01',
}

interface IconProps {
  name: string
  size?: number
  stroke?: number
  className?: string
  style?: React.CSSProperties
}

export default function Icon({ name, size = 16, stroke = 1.6, className = '', style }: IconProps) {
  const path = ICON_PATHS[name]
  if (!path) return <span className={'ic ' + className} style={style}>•</span>
  const segments = path.split('|')
  return (
    <svg
      className={'ic ' + className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {segments.map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}
