import { FileText, Cpu, CreditCard, ShieldCheck } from 'lucide-react'

const STEPS = [
  {
    icon:  FileText,
    color: 'var(--accent)',
    glow:  'rgba(56,189,248,0.15)',
    num:   '01',
    title: 'Post a Task',
    desc:  'Describe a research or analysis task and set a USDC bounty. The bounty is immediately locked in a Soroban smart-contract escrow.',
  },
  {
    icon:  Cpu,
    color: 'var(--purple)',
    glow:  'rgba(167,139,250,0.15)',
    num:   '02',
    title: 'Agent Executes',
    desc:  'An AI agent autonomously picks up the task, pays for data tools via x402 micropayments on Stellar, and processes your request.',
  },
  {
    icon:  CreditCard,
    color: 'var(--yellow)',
    glow:  'rgba(251,191,36,0.15)',
    num:   '03',
    title: 'x402 Micropayments',
    desc:  'Every API call the agent makes is paid on-chain via the x402 protocol — fractions of a cent, settled instantly on Stellar.',
  },
  {
    icon:  ShieldCheck,
    color: 'var(--green)',
    glow:  'rgba(52,211,153,0.15)',
    num:   '04',
    title: 'Escrow Released',
    desc:  'Once the agent delivers a verified result with an on-chain attestation, the Soroban contract automatically releases the bounty.',
  },
]

export default function HowItWorks() {
  return (
    <section className="mb-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <h2
          className="font-extrabold text-lg tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          How It Works
        </h2>
        <div
          className="flex-1 h-px"
          style={{ background: 'linear-gradient(90deg, var(--border-bright), transparent)' }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <div
              key={step.num}
              className="card p-5 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Subtle background glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                style={{ background: `radial-gradient(circle at 30% 30%, ${step.glow}, transparent 70%)` }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: step.glow, border: `1px solid ${step.color}33` }}
                  >
                    <Icon size={16} style={{ color: step.color }} />
                  </div>
                  <span
                    className="mono text-2xl font-bold opacity-20"
                    style={{ color: step.color }}
                  >
                    {step.num}
                  </span>
                </div>

                <h3
                  className="font-bold text-sm mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
