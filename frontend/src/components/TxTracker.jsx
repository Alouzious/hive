import { ExternalLink, ArrowRight } from 'lucide-react'

const EXPLORER = 'https://stellar.expert/explorer/testnet/tx'

function TxRow({ label, hash, color }) {
  if (!hash) return null
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0"
      style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: color || 'var(--accent)' }}
        />
        <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <a
        href={`${EXPLORER}/${hash}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 mono text-xs transition-colors hover:text-white"
        style={{ color: 'var(--accent)' }}
      >
        {hash.slice(0, 8)}...{hash.slice(-6)}
        <ExternalLink size={10} />
      </a>
    </div>
  )
}

export default function TxTracker({ tasks }) {
  const completed = tasks.filter(t => t.status === 'completed' && t.tx_hash)

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <ArrowRight size={14} style={{ color: 'var(--accent)' }} />
        <h2 className="font-bold text-sm tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          ON-CHAIN TRANSACTIONS
        </h2>
      </div>

      {completed.length === 0 ? (
        <p className="mono text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
          Transaction hashes will appear here as tasks complete
        </p>
      ) : (
        <div>
          {completed.map(task => (
            <div key={task.task_id} className="mb-4 last:mb-0">
              <p className="text-xs mb-2 truncate" style={{ color: 'var(--text-secondary)' }}>
                {task.description}
              </p>
              <TxRow
                label="ESCROW RELEASE"
                hash={task.tx_hash}
                color="var(--green)"
              />
              <TxRow
                label="OUTPUT HASH"
                hash={task.output_hash}
                color="var(--accent)"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
