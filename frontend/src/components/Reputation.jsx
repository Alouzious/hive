import { Star, TrendingUp, Award } from 'lucide-react'

export default function Reputation({ tasks }) {
  const completed   = tasks.filter(t => t.status === 'completed').length
  const total       = tasks.length
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 100
  const totalEarned = tasks
    .filter(t => t.status === 'completed')
    .reduce((s, t) => s + (t.bounty || 0), 0)

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Award size={14} style={{ color: 'var(--purple)' }} />
        <h2 className="font-bold text-sm tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          AGENT REPUTATION
        </h2>
      </div>

      <div className="flex flex-col gap-3">

        <div className="flex items-center justify-between">
          <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>SUCCESS RATE</span>
          <span className="mono text-sm font-bold" style={{ color: 'var(--green)' }}>
            {successRate}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${successRate}%`,
              background: 'linear-gradient(90deg, var(--green), var(--accent))',
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>TASKS COMPLETED</span>
          <span className="mono text-sm font-bold" style={{ color: 'var(--accent)' }}>
            {completed}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>TOTAL EARNED</span>
          <span className="mono text-sm font-bold" style={{ color: 'var(--green)' }}>
            {(totalEarned / 10_000_000).toFixed(2)} USDC
          </span>
        </div>

      </div>
    </div>
  )
}
