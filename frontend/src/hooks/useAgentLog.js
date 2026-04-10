import { useState, useEffect } from 'react'

// Generates realistic agent log entries based on task state transitions
export function useAgentLog(tasks) {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    const newLogs = []

    tasks.forEach(task => {
      const base = task.created_at * 1000

      newLogs.push({
        id:        `${task.task_id}-posted`,
        timestamp: base,
        type:      'info',
        message:   `Task posted — escrow locked: ${(task.bounty / 10_000_000).toFixed(2)} USDC`,
        task_id:   task.task_id,
      })

      if (task.status === 'in_progress' || task.status === 'completed') {
        newLogs.push({
          id:        `${task.task_id}-accepted`,
          timestamp: base + 2000,
          type:      'agent',
          message:   'Agent accepted task — beginning execution',
          task_id:   task.task_id,
        })
        newLogs.push({
          id:        `${task.task_id}-pay1`,
          timestamp: base + 4000,
          type:      'payment',
          message:   'x402 micropayment: search query — $0.001 USDC on Stellar',
          task_id:   task.task_id,
        })
        newLogs.push({
          id:        `${task.task_id}-pay2`,
          timestamp: base + 6000,
          type:      'payment',
          message:   'x402 micropayment: data call — $0.001 USDC on Stellar',
          task_id:   task.task_id,
        })
      }

      if (task.status === 'completed') {
        newLogs.push({
          id:        `${task.task_id}-delivered`,
          timestamp: base + 10000,
          type:      'success',
          message:   'Result delivered — on-chain attestation emitted',
          task_id:   task.task_id,
        })
        newLogs.push({
          id:        `${task.task_id}-released`,
          timestamp: base + 12000,
          type:      'success',
          message:   `Soroban escrow released: ${(task.bounty / 10_000_000).toFixed(2)} USDC to agent`,
          task_id:   task.task_id,
        })
      }
    })

    setLogs(newLogs.sort((a, b) => b.timestamp - a.timestamp))
  }, [tasks])

  return logs
}
