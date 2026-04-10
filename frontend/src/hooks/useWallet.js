/**
 * useWallet — Stellar Wallets Kit Integration
 *
 * Uses the official Stellar Wallets Kit to support all Stellar wallets:
 * Freighter, xBull, Albedo, Lobstr, Rabet, WalletConnect, Hana, and more.
 *
 * Reference: https://stellarwalletskit.dev/
 */
import { useState, useCallback, useEffect } from 'react'

let kit = null

async function getKit() {
  if (kit) return kit
  try {
    const { StellarWalletsKit, WalletNetwork } =
      await import('@creit-tech/stellar-wallets-kit')
    const { defaultModules } =
      await import('@creit-tech/stellar-wallets-kit/modules/utils')

    kit = new StellarWalletsKit({
      network:  WalletNetwork.TESTNET,
      modules:  defaultModules(),
    })
    return kit
  } catch (err) {
    console.warn('Stellar Wallets Kit unavailable, using fallback:', err.message)
    return null
  }
}

export function useWallet() {
  const [address,    setAddress]    = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [error,      setError]      = useState(null)

  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      const walletKit = await getKit()

      if (walletKit) {
        await walletKit.openModal({
          onWalletSelected: async (option) => {
            walletKit.setWallet(option.id)
            const { address: addr } = await walletKit.getAddress()
            setAddress(addr)
          },
        })
      } else {
        // No wallet kit available and no Freighter extension detected
        if (typeof window !== 'undefined' && window.freighter) {
          await window.freighter.isConnected()
          const addr = await window.freighter.getPublicKey()
          setAddress(addr)
        } else {
          throw new Error('No Stellar wallet detected. Please install Freighter and try again.')
        }
      }
    } catch (err) {
      const msg = err.message || 'Wallet connection failed.'
      console.error('Wallet connect error:', msg)
      setError(msg)
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    kit = null
  }, [])

  const signTransaction = useCallback(async (txXdr) => {
    const walletKit = await getKit()
    if (!walletKit || !address) throw new Error('Wallet not connected')
    const { signedTxXdr } = await walletKit.signTransaction(txXdr, {
      networkPassphrase: 'Test SDF Network ; September 2015',
      address,
    })
    return signedTxXdr
  }, [address])

  return { address, connecting, error, connect, disconnect, signTransaction }
}
