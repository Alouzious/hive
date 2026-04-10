import ReactMarkdown from 'react-markdown'
import { FileText, Hash, ExternalLink } from 'lucide-react'

export default function TaskResult({ task }) {
  if (!task?.result) return null

  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={14} style={{ color: 'var(--green)' }} />
        <h2 className="font-bold text-sm tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          AGENT RESULT
        </h2>
        <span className="badge-completed mono text-xs px-2 py-0.5 rounded ml-auto">
          DELIVERED
        </span>
      </div>

      <p className="text-xs mb-3 truncate" style={{ color: 'var(--text-muted)' }}>
        Task: {task.description}
      </p>

      <div
        className="rounded-lg p-4 mb-4 overflow-y-auto max-h-64 text-sm leading-relaxed"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <div className="prose prose-invert prose-sm max-w-none" style={{
          color: 'var(--text-primary)',
        }}>
          {task.result.split('\n').map((line, i) => {
            if (line.startsWith('### ')) return (
              <h3 key={i} className="font-bold text-sm mt-3 mb-1" style={{ color: 'var(--accent)' }}>
                {line.replace('### ', '')}
              </h3>
            )
            if (line.startsWith('## ')) return (
              <h2 key={i} className="font-bold text-base mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
                {line.replace('## ', '')}
              </h2>
            )
            if (line.startsWith('# ')) return (
              <h1 key={i} className="font-bold text-lg mt-2 mb-3" style={{ color: 'var(--text-primary)' }}>
                {line.replace('# ', '')}
              </h1>
            )
            if (line.startsWith('- ')) return (
              <div key={i} className="flex items-start gap-2 mb-1">
                <span style={{ color: 'var(--accent)' }} className="mt-0.5 flex-shrink-0">·</span>
                <span style={{ color: 'var(--text-secondary)' }}>{line.replace('- ', '')}</span>
              </div>
            )
            if (line.startsWith('*') && line.endsWith('*')) return (
              <p key={i} className="text-xs mt-2" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {line.replace(/\*/g, '')}
              </p>
            )
            if (line === '') return <div key={i} className="h-2" />
            return (
              <p key={i} className="mb-1" style={{ color: 'var(--text-secondary)' }}>
                {line}
              </p>
            )
          })}
        </div>
      </div>

      {task.output_hash && (
        <div className="flex items-center gap-2 p-2 rounded-lg mb-2"
          style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
          <Hash size={10} style={{ color: 'var(--green)', flexShrink: 0 }} />
          <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>ON-CHAIN ATTESTATION:</span>
          <span className="mono text-xs truncate" style={{ color: 'var(--green)' }}>{task.output_hash}</span>
        </div>
      )}

      {task.tx_hash && (
        <a
          href={'https://stellar.expert/explorer/testnet/tx/' + task.tx_hash}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between mt-2 p-2 rounded-lg transition-all hover:border-green-500/40"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>ESCROW RELEASE TX</span>
          <div className="flex items-center gap-1 mono text-xs" style={{ color: 'var(--green)' }}>
            {task.tx_hash.slice(0, 12)}...
            <ExternalLink size={10} />
          </div>
        </a>
      )}
    </div>
  )
}
