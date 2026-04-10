import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API = '/api'

const DEMO_TASKS = [
  {
    task_id:    'demo-1',
    description: 'Research the top 3 DeFi protocols on Stellar and summarize their yield rates',
    bounty:     20_000_000,
    status:     'completed',
    created_at: Math.floor(Date.now() / 1000) - 3600,
    result:     'After analyzing the Stellar DeFi ecosystem, the top protocols are: (1) Aquarius — offering ~8.2% APY on USDC/XLM LP, (2) Blend Protocol — lending at 6.4% APY, (3) Phoenix DEX — providing 11% returns on select pairs. All liquidity is deep and settlement is near-instant on Stellar.',
    tx_hash:    'a3f9e2d1b4c8f0e7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3',
    output_hash: 'b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6',
  },
  {
    task_id:    'demo-2',
    description: 'Find the most active Stellar validators this week and compare their uptime',
    bounty:     15_000_000,
    status:     'completed',
    created_at: Math.floor(Date.now() / 1000) - 7200,
    result:     'Top validators by uptime this week: SDF-1 (100%), SDF-2 (100%), Coinbase (99.98%), Blockdaemon (99.96%), Lobstr (99.94%). All maintain >99.9% average. Network consensus health is excellent with 74 active validators.',
    tx_hash:    'c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7',
    output_hash: 'd9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8',
  },
  {
    task_id:    'demo-3',
    description: 'Analyze recent XLM price movements and summarize key market signals',
    bounty:     10_000_000,
    status:     'in_progress',
    created_at: Math.floor(Date.now() / 1000) - 1800,
  },
  {
    task_id:    'demo-4',
    description: 'Summarize the latest Stellar Development Foundation blog posts on AI integrations',
    bounty:     5_000_000,
    status:     'open',
    created_at: Math.floor(Date.now() / 1000) - 600,
  },
]

export function useTasks() {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [isDemo,  setIsDemo]  = useState(false)

  // Poll for task updates every 5 seconds
  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchTasks() {
    try {
      const { data } = await axios.get(`${API}/tasks/all`, { timeout: 4000 })
      const sorted = data.sort((a, b) => b.created_at - a.created_at)
      setTasks(sorted)
      // Switch off demo mode once real tasks are loaded
      if (sorted.length > 0) setIsDemo(false)
      else if (sorted.length === 0 && !isDemo) setIsDemo(true)
    } catch (err) {
      // API unavailable — fall back to demo data
      setIsDemo(true)
      setTasks(DEMO_TASKS)
    }
  }

  const createTask = useCallback(async (taskData) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.post(`${API}/tasks`, taskData)
      setTasks(prev => [data, ...prev.filter(t => !t.task_id?.startsWith('demo-'))])
      setIsDemo(false)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { tasks, createTask, loading, error, isDemo, refetch: fetchTasks }
}
