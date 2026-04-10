import { Zap, Globe, Lock, Bot } from 'lucide-react'

const FEATURES = [
  {
    icon:  Zap,
    color: 'var(--yellow)',
    title: 'x402 Protocol',
    desc:  'HTTP-native micropayments. Agents pay for APIs with fractions of a cent on Stellar.',
  },
  {
    icon:  Globe,
    color: 'var(--accent)',
    title: 'Stellar Network',
    desc:  '5-second finality, ~$0.00001 fees. The fastest, cheapest settlement layer for AI.',
  },
  {
    icon:  Lock,
    color: 'var(--purple)',
    title: 'Soroban Escrow',
    desc:  'Trustless bounty escrow via Soroban smart contracts. Funds release only on delivery.',
  },
  {
    icon:  Bot,
    color: 'var(--green)',
    title: 'Autonomous Agents',
    desc:  'Fully autonomous AI agents that find, accept, and execute tasks without human intervention.',
  },
]

export default function FeatureHighlights() {
  return (
    <section className="mb-10 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {FEATURES.map(feat => {
          const Icon = feat.icon
          return (
            <div
              key={feat.title}
              className="card px-4 py-4 flex flex-col gap-3 group transition-all duration-300 hover:border-sky-500/30"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${feat.color}18`, border: `1px solid ${feat.color}30` }}
              >
                <Icon size={14} style={{ color: feat.color }} />
              </div>
              <div>
                <div
                  className="font-bold text-xs mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {feat.title}
                </div>
                <div
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {feat.desc}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
