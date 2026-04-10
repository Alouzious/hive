import { useEffect, useRef } from 'react'
import { Bot, Clock, CheckCircle, Loader, Circle } from 'lucide-react'

function statusIcon(status) {
  switch (status) {
    case 'open':        return <Circle size={12} style={{ color: 'var(--accent)' }} />
    case 'in_progress': return <Loader size={12} style={{ color: 'var(--yellow)', animation: 'spin 1s linear infinite' }} />
    case 'completed':   return <CheckCircle size={12} style={{ color: 'var(--green)' }} />
    default:            return <Circle size={12} style={{ color: 'var(--text-muted)' }} />
  }
}

function statusBadge(status) {
  const map = {
    open:        'badge-open',
    in_progress: 'badge-progress',
    completed:   'badge-completed',
  }
  return `inline-block px-2 py-0.5 rounded mono text-xs ${map[status] || ''}`
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts * 1000) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function AgentLog({ tasks, selectedTask, onSelectTask }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [tasks.length])

  return (
    <div className="card p-5">

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Bot size={14} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold text-sm tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            AGENT ACTIVITY
          </h2>
        </div>
        <div className="flex items-center gap-2 mono text-xs" style={{ color: 'var(--green)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: 'var(--green)', display: 'inline-block' }} />
          LIVE
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="py-12 text-center">
          <Bot size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
            No tasks yet. Post a task to activate the agent.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {tasks.map(task => (
            <button
              key={task.task_id}
              onClick={() => onSelectTask(task)}
              className="text-left w-full p-3 rounded-lg transition-all hover:border-sky-500/40"
              style={{
                background:  selectedTask?.task_id === task.task_id
                  ? 'rgba(56,189,248,0.08)'
                  : 'var(--bg-secondary)',
                border: `1px solid ${selectedTask?.task_id === task.task_id
                  ? 'rgba(56,189,248,0.3)'
                  : 'var(--border)'}`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  {statusIcon(task.status)}
                  <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {task.description}
                  </p>
                </div>
                <span className={statusBadge(task.status)}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <span className="mono text-xs" style={{ color: 'var(--accent)' }}>
                  {(task.bounty / 10_000_000).toFixed(2)} USDC
                </span>
                <span className="mono text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Clock size={10} />
                  {timeAgo(task.created_at)}
                </span>
              </div>
            </button>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

    </div>
  )
}
