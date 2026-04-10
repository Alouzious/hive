import { useState } from 'react'
import { Send, Lock, ChevronDown, ChevronUp } from 'lucide-react'

const EXAMPLE_TASKS = [
  'Research the top 3 DeFi protocols on Stellar and summarize their yield rates',
  'Find the most active Stellar validators this week and compare their uptime',
  'Analyze recent XLM price movements and summarize key market signals',
  'Compare Blend, Soroswap and Phoenix protocols on Stellar by TVL and APY',
]

export default function TaskForm({ walletAddress, onTaskCreated, loading }) {
  const [description,   setDescription]   = useState('')
  const [bounty,        setBounty]         = useState('2')
  const [submitting,    setSubmitting]     = useState(false)
  const [showExamples,  setShowExamples]   = useState(false)
  const [success,       setSuccess]        = useState(false)
  const [error,         setError]          = useState(null)

  async function handleSubmit() {
    const trimmed = description.trim()
    if (!trimmed) {
      setError('Please describe the task you want the agent to research.')
      return
    }
    if (trimmed.length < 10) {
      setError('Task description is too short. Please be more specific.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const deadline = Math.floor(Date.now() / 1000) + 86400
      await onTaskCreated({
        description: trimmed,
        bounty:      Math.floor(parseFloat(bounty) * 10_000_000),
        deadline,
        poster:      walletAddress || 'DEMO_POSTER',
      })
      setSuccess(true)
      setDescription('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Failed to post task. Is the API server running?')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-sm tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          POST A TASK
        </h2>
        <Lock size={12} style={{ color: 'var(--text-muted)' }} />
      </div>

      <div className="mb-4">
        <label className="block mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          TASK DESCRIPTION
        </label>
        <textarea
          value={description}
          onChange={e => { setDescription(e.target.value); setError(null) }}
          placeholder="e.g. Research the top 3 DeFi protocols on Stellar and summarize their yield rates"
          rows={4}
          className="w-full rounded-lg px-3 py-3 text-sm resize-none"
          style={{
            background:  'var(--bg-secondary)',
            border:      '1px solid ' + (error ? 'rgba(248,113,113,0.4)' : description ? 'var(--border-bright)' : 'var(--border)'),
            color:       'var(--text-primary)',
            fontFamily:  'var(--font-display)',
            outline:     'none',
          }}
        />

        {error && (
          <p className="mono text-xs mt-1" style={{ color: 'var(--red)' }}>{error}</p>
        )}

        <button
          onClick={() => setShowExamples(!showExamples)}
          className="flex items-center gap-1 mt-2 mono text-xs transition-colors hover:text-white"
          style={{ color: 'var(--text-muted)' }}
        >
          {showExamples ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          EXAMPLE TASKS
        </button>

        {showExamples && (
          <div className="mt-2 flex flex-col gap-1">
            {EXAMPLE_TASKS.map((ex, i) => (
              <button
                key={i}
                onClick={() => { setDescription(ex); setShowExamples(false); setError(null) }}
                className="text-left text-xs px-3 py-2 rounded-lg transition-all"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-5">
        <label className="block mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          USDC BOUNTY
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={bounty}
            onChange={e => setBounty(e.target.value)}
            min="0.1"
            step="0.5"
            className="w-full rounded-lg px-3 py-2 mono text-sm"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--accent)', outline: 'none' }}
          />
          <span className="mono text-xs font-bold px-3 py-2 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent)', border: '1px solid rgba(56,189,248,0.2)' }}>
            USDC
          </span>
        </div>
        <p className="mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Locked in Soroban escrow until agent delivers result
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !description.trim()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg mono text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: success ? 'rgba(52,211,153,0.2)' : 'rgba(56,189,248,0.15)',
          border:     success ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(56,189,248,0.3)',
          color:      success ? 'var(--green)' : 'var(--accent)',
        }}
      >
        <Send size={14} />
        {submitting ? 'LOCKING ESCROW...' : success ? 'TASK POSTED' : 'POST TASK'}
      </button>

      {!walletAddress && (
        <p className="mono text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
          Connect wallet to sign escrow deposit
        </p>
      )}
    </div>
  )
}
