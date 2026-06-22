'use client'

import React from 'react'

interface TopbarProps {
  title?: string
  crumbs?: string[]
  right?: React.ReactNode
}

export default function Topbar({ title, crumbs, right }: TopbarProps) {
  return (
    <div className="topbar">
      {crumbs ? (
        <div className="crumbs">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 ? <span className="sep" style={{ margin: '0 4px', color: 'var(--fg-4)' }}>/</span> : null}
              <span style={{ color: i === crumbs.length - 1 ? 'var(--fg)' : 'var(--fg-2)' }}>{c}</span>
            </React.Fragment>
          ))}
        </div>
      ) : (
        <h1>{title}</h1>
      )}
      <div className="topbar-right">{right}</div>
    </div>
  )
}
