import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Activity, Hexagon } from 'lucide-react'
import Header          from './components/Header.jsx'
import TaskForm        from './components/TaskForm.jsx'
import AgentLog        from './components/AgentLog.jsx'
import TxTracker       from './components/TxTracker.jsx'
import TaskResult      from './components/TaskResult.jsx'
import EscrowStatus    from './components/EscrowStatus.jsx'
import Reputation      from './components/Reputation.jsx'
import FeatureHighlights from './components/FeatureHighlights.jsx'
import { useTasks }    from './hooks/useTasks.js'

export default function App() {
  const navigate = useNavigate()
  const { tasks, createTask, loading } = useTasks()
  const [selectedTask,  setSelectedTask]  = useState(null)
  const [walletAddress, setWalletAddress] = useState(null)

  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.task_id === selectedTask.task_id)
      if (updated) setSelectedTask(updated)
    }
  }, [tasks])

  const open      = tasks.filter(t => t.status === 'open').length
  const progress  = tasks.filter(t => t.status === 'in_progress').length
  const completed = tasks.filter(t => t.status === 'completed').length
  const settled   = tasks
    .filter(t => t.status === 'completed')
    .reduce((s, t) => s + (t.bounty || 0), 0)

  const stats = [
    {
      label: 'OPEN TASKS',
      value: open,
      color: 'var(--accent)',
      bg:    'rgba(56,189,248,0.06)',
      border:'rgba(56,189,248,0.2)',
    },
    {
      label: 'IN PROGRESS',
      value: progress,
      color: 'var(--yellow)',
      bg:    'rgba(251,191,36,0.06)',
      border:'rgba(251,191,36,0.2)',
    },
    {
      label: 'COMPLETED',
      value: completed,
      color: 'var(--green)',
      bg:    'rgba(52,211,153,0.06)',
      border:'rgba(52,211,153,0.2)',
    },
    {
      label: 'USDC SETTLED',
      value: (settled / 10_000_000).toFixed(2),
      color: 'var(--green)',
      bg:    'rgba(52,211,153,0.06)',
      border:'rgba(52,211,153,0.2)',
      suffix: ' USDC',
    },
  ]

  return (
    <div className="min-h-screen grid-bg relative">
      <div className="scanlines fixed inset-0 z-50 pointer-events-none opacity-10" />

      <Header walletAddress={walletAddress} setWalletAddress={setWalletAddress} />

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 mono text-xs transition-colors hover:text-white px-3 py-2 rounded-lg"
              style={{
                color: 'var(--text-muted)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}>
              <ArrowLeft size={12} /> HOME
            </button>
            <div className="h-4 w-px" style={{ background: 'var(--border)' }} />
            <div className="flex items-center gap-2">
              <Activity size={13} style={{ color: 'var(--accent)' }} />
              <span className="mono text-xs font-bold tracking-widest"
                style={{ color: 'var(--text-secondary)' }}>
                TASK DASHBOARD
              </span>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 mono text-xs"
            style={{ color: 'var(--green)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse-dot"
              style={{ background: 'var(--green)' }} />
            AGENT LIVE
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="rounded-xl px-5 py-4 transition-all"
              style={{
                background: s.bg,
                border: '1px solid ' + s.border,
              }}>
              <div className="mono font-extrabold mb-1"
                style={{ fontSize: '1.75rem', color: s.color, lineHeight: 1 }}>
                {s.value}{s.suffix || ''}
              </div>
              <div className="mono text-xs tracking-widest mt-2"
                style={{ color: 'var(--text-muted)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Feature highlights strip */}
        <FeatureHighlights />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="lg:col-span-1 flex flex-col gap-5">

            {/* Section label */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
              <span className="mono text-xs tracking-widest px-2"
                style={{ color: 'var(--text-muted)' }}>
                POST WORK
              </span>
              <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
            </div>

            <TaskForm
              walletAddress={walletAddress}
              onTaskCreated={createTask}
              loading={loading}
            />
            <EscrowStatus tasks={tasks} selectedTask={selectedTask} />
            <Reputation tasks={tasks} />
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Section label */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
              <span className="mono text-xs tracking-widest px-2"
                style={{ color: 'var(--text-muted)' }}>
                AGENT ACTIVITY
              </span>
              <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
            </div>

            <AgentLog
              tasks={tasks}
              selectedTask={selectedTask}
              onSelectTask={setSelectedTask}
            />

            {selectedTask && (
              <TaskResult task={selectedTask} />
            )}

            <TxTracker tasks={tasks} />
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="mt-20 border-t py-8"
        style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)' }}>
              <Hexagon size={12} style={{ color: 'var(--accent)' }} />
            </div>
            <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
              HIVE — Built for Stellar Hacks: Agents 2026
            </span>
          </div>
          <a
            href="https://github.com/Alouzious/hive"
            target="_blank" rel="noreferrer"
            className="mono text-xs hover:text-white transition-colors"
            style={{ color: 'var(--accent)' }}>
            github.com/Alouzious/hive
          </a>
        </div>
      </footer>
    </div>
  )
}
