import { Shield, Lock, Unlock } from 'lucide-react'

export default function EscrowStatus({ tasks, selectedTask }) {
  const open      = tasks.filter(t => t.status === 'open').length
  const progress  = tasks.filter(t => t.status === 'in_progress').length
  const completed = tasks.filter(t => t.status === 'completed').length

  const totalLocked = tasks
    .filter(t => t.status === 'open' || t.status === 'in_progress')
    .reduce((sum, t) => sum + (t.bounty || 0), 0)

  const totalReleased = tasks
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.bounty || 0), 0)

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={14} style={{ color: 'var(--accent)' }} />
        <h2 className="font-bold text-sm tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          SOROBAN ESCROW
        </h2>
      </div>

      <div className="flex flex-col gap-3">

        <div className="flex items-center justify-between p-3 rounded-lg"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Lock size={12} style={{ color: 'var(--yellow)' }} />
            <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>LOCKED</span>
          </div>
          <span className="mono text-sm font-bold" style={{ color: 'var(--yellow)' }}>
            {(totalLocked / 10_000_000).toFixed(2)} USDC
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Unlock size={12} style={{ color: 'var(--green)' }} />
            <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>RELEASED</span>
          </div>
          <span className="mono text-sm font-bold" style={{ color: 'var(--green)' }}>
            {(totalReleased / 10_000_000).toFixed(2)} USDC
          </span>
        </div>

      </div>

      {/* Selected task escrow detail */}
      {selectedTask && (
        <div className="mt-4 p-3 rounded-lg"
          style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)' }}>
          <p className="mono text-xs mb-2" style={{ color: 'var(--accent)' }}>
            SELECTED TASK
          </p>
          <p className="text-xs mb-2 truncate" style={{ color: 'var(--text-secondary)' }}>
            {selectedTask.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
              BOUNTY
            </span>
            <span className="mono text-sm font-bold" style={{ color: 'var(--accent)' }}>
              {(selectedTask.bounty / 10_000_000).toFixed(2)} USDC
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
              STATUS
            </span>
            <span className={`mono text-xs px-2 py-0.5 rounded ${
              selectedTask.status === 'completed' ? 'badge-completed' :
              selectedTask.status === 'in_progress' ? 'badge-progress' : 'badge-open'
            }`}>
              {selectedTask.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      )}

    </div>
  )
}
