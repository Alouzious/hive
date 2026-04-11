import { useState, useEffect } from 'react'
import { Wallet, Hexagon, ExternalLink, LogOut, Droplets, X, Download, Check, AlertCircle, Loader } from 'lucide-react'

// Use package export subpaths so Vite can resolve under the package exports map.

let kitInstance = null
let kitInitialized = false

async function initKit() {
  if (kitInitialized && kitInstance) return kitInstance
  try {
    const { StellarWalletsKit, WalletNetwork } = await import('@creit-tech/stellar-wallets-kit/sdk')
    const { FreighterModule }                  = await import('@creit-tech/stellar-wallets-kit/modules/freighter')
    const { LobstrModule }                     = await import('@creit-tech/stellar-wallets-kit/modules/lobstr')
    const { AlbedoModule }                     = await import('@creit-tech/stellar-wallets-kit/modules/albedo')
    const { xBullModule }                      = await import('@creit-tech/stellar-wallets-kit/modules/xbull')

    kitInstance = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: 'freighter',
      modules: [
        new FreighterModule(),
        new LobstrModule(),
        new AlbedoModule(),
        new xBullModule(),
      ],
    })
    kitInitialized = true
    return kitInstance
  } catch (err) {
    console.warn('Kit init failed:', err.message)
    return null
  }
}

async function connectWithKit(walletId) {
  const kit = await initKit()
  if (!kit) throw new Error('Wallets Kit not available')
  kit.setWallet(walletId)
  const { address } = await kit.getAddress()
  if (!address) throw new Error('No address returned')
  return address
}

// Wallet definitions with detection and connect logic
const WALLETS = [
  {
    id:         'freighter',
    name:       'Freighter',
    desc:       'Most popular Stellar browser extension',
    installUrl: 'https://www.freighter.app',
    checkFn:    () => {
      return !!(
        window?.freighter ||
        window?.freighterApi ||
        window?.stellar?.freighter
      )
    },
    connectFn: async () => {
      try {
        return await connectWithKit('freighter')
      } catch (kitErr) {
        // Direct Freighter fallback
        const api = window?.freighterApi || window?.freighter
        if (!api) throw new Error('Freighter not detected. Please refresh the page.')
        const connected = await api.isConnected()
        if (!connected.isConnected) throw new Error('Please unlock your Freighter wallet.')
        const result = await api.getAddress()
        return result?.address || result
      }
    },
  },
  {
    id:         'lobstr',
    name:       'LOBSTR',
    desc:       'Mobile and web Stellar wallet',
    installUrl: 'https://lobstr.co/join/',
    checkFn:    () => !!(window?.lobstrWallet || window?.lobstr),
    connectFn:  async () => connectWithKit('lobstr'),
  },
  {
    id:         'albedo',
    name:       'Albedo',
    desc:       'Web-based signer — no install needed',
    installUrl: 'https://albedo.link',
    checkFn:    () => true,
    connectFn:  async () => {
      try {
        return await connectWithKit('albedo')
      } catch {
        return new Promise((resolve, reject) => {
          const popup = window.open(
            'https://albedo.link/intent/public-key?title=Hive',
            'albedo_connect',
            'width=540,height=720,left=200,top=100'
          )
          if (!popup) { reject(new Error('Popup blocked. Allow popups and try again.')); return }
          const handler = (e) => {
            if (e.origin !== 'https://albedo.link') return
            window.removeEventListener('message', handler)
            if (e.data?.pubkey) resolve(e.data.pubkey)
            else reject(new Error('Albedo connection cancelled.'))
          }
          window.addEventListener('message', handler)
          setTimeout(() => { window.removeEventListener('message', handler); reject(new Error('Albedo timed out.')) }, 120000)
        })
      }
    },
  },
  {
    id:         'xbull',
    name:       'xBull',
    desc:       'PWA and extension Stellar wallet',
    installUrl: 'https://xbull.app',
    checkFn:    () => !!(window?.xBullSDK),
    connectFn:  async () => connectWithKit('xbull'),
  },
]

export default function Header({ walletAddress, setWalletAddress }) {
  const [showModal,    setShowModal]    = useState(false)
  const [connecting,   setConnecting]   = useState(null)
  const [walletStates, setWalletStates] = useState({})
  const [error,        setError]        = useState(null)
  const [checked,      setChecked]      = useState(false)

  // Pre-init kit on page load
  useEffect(() => { initKit() }, [])

  // Detect wallets when modal opens — wait 600ms for extensions to inject
  useEffect(() => {
    if (showModal && !checked) {
      setTimeout(() => {
        const states = {}
        WALLETS.forEach(w => {
          try { states[w.id] = w.checkFn() }
          catch { states[w.id] = false }
        })
        setWalletStates(states)
        setChecked(true)
      }, 600)
    }
    if (!showModal) setChecked(false)
  }, [showModal])

  async function handleConnect(wallet) {
    setConnecting(wallet.id)
    setError(null)
    try {
      const address = await wallet.connectFn()
      setWalletAddress(address)
      setShowModal(false)
    } catch (err) {
      const msg = err.message || 'Connection failed.'
      if (msg.includes('not detected') || msg.includes('not found') || msg.includes('not installed')) {
        setError(msg + ' Please install it, refresh the page, and try again.')
      } else if (msg.includes('declined') || msg.includes('rejected') || msg.includes('cancelled') || msg.includes('User')) {
        setError('Connection rejected. Please approve in your wallet and try again.')
      } else if (msg.includes('unlock') || msg.includes('locked')) {
        setError('Please unlock your wallet first, then try again.')
      } else if (msg.includes('Popup')) {
        setError('Popup blocked. Please allow popups for this site.')
      } else {
        setError(msg)
      }
    } finally {
      setConnecting(null)
    }
  }

  function truncate(addr) {
    if (!addr) return ''
    return addr.slice(0, 6) + '...' + addr.slice(-4)
  }

  const isInstalled = (wallet) => {
    if (!checked) return null
    return walletStates[wallet.id] === true
  }

  return (
    <>
      {/* Testnet banner */}
      <div className="w-full py-1.5 px-4 text-center mono text-xs flex items-center justify-center gap-3 flex-wrap"
        style={{ background: 'rgba(56,189,248,0.06)', borderBottom: '1px solid rgba(56,189,248,0.1)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Stellar Testnet</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <a href="https://lab.stellar.org/account/fund" target="_blank" rel="noreferrer"
          className="flex items-center gap-1 hover:text-white transition-colors" style={{ color: 'var(--accent)' }}>
          <Droplets size={10} /> Fund wallet with XLM <ExternalLink size={9} />
        </a>
        <span style={{ color: 'var(--border)' }}>·</span>
        <a href="https://faucet.circle.com" target="_blank" rel="noreferrer"
          className="flex items-center gap-1 hover:text-white transition-colors" style={{ color: 'var(--green)' }}>
          <Droplets size={10} /> Get testnet USDC <ExternalLink size={9} />
        </a>
        <span style={{ color: 'var(--border)' }}>·</span>
        <a href="https://lab.stellar.org" target="_blank" rel="noreferrer"
          className="flex items-center gap-1 hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
          Stellar Lab <ExternalLink size={9} />
        </a>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{ background: 'rgba(2,8,23,0.92)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)' }}>
              <Hexagon size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-lg tracking-tight">HIVE</span>
              <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>v0.1.0</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-5 mono text-xs" style={{ color: 'var(--text-muted)' }}>
            <a href="https://stellar.expert/explorer/testnet/contract/CBLO3GRWKVJBYKL5GGD2WUY2VWORDXUP4HCS4SM32RYYOHZVWT3DIVP4"
              target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
              CONTRACT <ExternalLink size={10} />
            </a>
            <a href="https://github.com/Alouzious/hive" target="_blank" rel="noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors">
              GITHUB <ExternalLink size={10} />
            </a>
            <span style={{ color: 'var(--border-bright)' }}>|</span>
            <span style={{ color: 'var(--accent)' }}>STELLAR TESTNET</span>
          </nav>

          {walletAddress ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mono text-xs"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: 'var(--green)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse-dot flex-shrink-0"
                  style={{ background: 'var(--green)', display: 'inline-block' }} />
                {truncate(walletAddress)}
              </div>
              <button onClick={() => setWalletAddress(null)}
                className="p-2 rounded-lg transition-all hover:text-red-400"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                title="Disconnect">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => { setError(null); setShowModal(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg mono text-xs font-bold transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(129,140,248,0.15))', border: '1px solid rgba(56,189,248,0.35)', color: 'var(--accent)' }}>
              <Wallet size={14} /> CONNECT WALLET
            </button>
          )}
        </div>
      </header>

      {/* Wallet Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setError(null) } }}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-slide-up"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-bright)', boxShadow: '0 0 80px rgba(56,189,248,0.08)' }}>

            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-base">Connect a Wallet</h2>
              <button onClick={() => { setShowModal(false); setError(null) }}
                className="p-1.5 rounded-lg transition-colors hover:text-white"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                <X size={14} />
              </button>
            </div>
            <p className="mono text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              Connect your Stellar wallet to post tasks and sign escrow transactions
            </p>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg mb-4 text-xs"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!checked && (
              <div className="flex items-center justify-center gap-2 py-8 mono text-xs" style={{ color: 'var(--text-muted)' }}>
                <Loader size={14} className="animate-spin" />
                Detecting installed wallets...
              </div>
            )}

            {checked && (
              <div className="flex flex-col gap-2">
                {WALLETS.map(wallet => {
                  const installed    = isInstalled(wallet)
                  const isConnecting = connecting === wallet.id
                  const available    = installed || wallet.id === 'albedo'

                  return (
                    <div key={wallet.id}>
                      {available ? (
                        <button
                          onClick={() => handleConnect(wallet)}
                          disabled={!!connecting}
                          className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                          style={{
                            background: isConnecting ? 'rgba(56,189,248,0.1)' : 'var(--bg-secondary)',
                            border:     isConnecting ? '1px solid rgba(56,189,248,0.35)' : '1px solid var(--border)',
                          }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                            <Wallet size={16} style={{ color: isConnecting ? 'var(--accent)' : 'var(--text-secondary)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{wallet.name}</span>
                              {wallet.id !== 'albedo' && installed && (
                                <span className="mono text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                                  style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--green)', border: '1px solid rgba(52,211,153,0.2)' }}>
                                  <Check size={9} /> Detected
                                </span>
                              )}
                              {wallet.id === 'albedo' && (
                                <span className="mono text-xs px-1.5 py-0.5 rounded"
                                  style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent)', border: '1px solid rgba(56,189,248,0.2)' }}>
                                  Web-based
                                </span>
                              )}
                            </div>
                            <div className="mono text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {isConnecting ? 'Check your wallet to approve...' : wallet.desc}
                            </div>
                          </div>
                          {isConnecting && <Loader size={14} className="flex-shrink-0 animate-spin" style={{ color: 'var(--accent)' }} />}
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-xl"
                          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', opacity: 0.5 }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                            <Wallet size={16} style={{ color: 'var(--text-muted)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>{wallet.name}</div>
                            <div className="mono text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Not detected — install to use</div>
                          </div>
                          <a href={wallet.installUrl} target="_blank" rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg mono text-xs font-bold transition-all hover:scale-105 flex-shrink-0"
                            style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: 'var(--accent)' }}>
                            <Download size={10} /> Install
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-5 pt-4 border-t mono text-xs text-center"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              New to Stellar?{' '}
              <a href="https://www.freighter.app" target="_blank" rel="noreferrer"
                className="hover:underline" style={{ color: 'var(--accent)' }}>
                Install Freighter
              </a>
              {' '}then{' '}
              <a href="https://lab.stellar.org/account/fund" target="_blank" rel="noreferrer"
                className="hover:underline" style={{ color: 'var(--green)' }}>
                fund your wallet
              </a>
              {' '}to get started
            </div>
          </div>
        </div>
      )}
    </>
  )
}
