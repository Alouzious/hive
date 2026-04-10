import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { paymentMiddlewareFromConfig } from '@x402/express'
import { HTTPFacilitatorClient } from '@x402/core/server'
import { ExactStellarScheme } from '@x402/stellar/exact/server'

dotenv.config({ path: '../.env' })

const PORT        = process.env.X402_PORT || 3002
const NETWORK     = 'stellar:testnet'
const FACILITATOR = 'https://www.x402.org/facilitator'
const PAY_TO      = process.env.AGENT_PUBLIC_KEY || process.env.DEPLOYER_PUBLIC_KEY

if (!PAY_TO) {
  console.error('ERROR: AGENT_PUBLIC_KEY not set in .env')
  process.exit(1)
}

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hive-x402-tool-server', network: NETWORK, pay_to: PAY_TO })
})

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR })
const stellarScheme     = new ExactStellarScheme()

app.use(
  paymentMiddlewareFromConfig(
    {
      'GET /search': { accepts: { scheme: 'exact', price: '$0.001', network: NETWORK, payTo: PAY_TO } },
      'GET /data':   { accepts: { scheme: 'exact', price: '$0.001', network: NETWORK, payTo: PAY_TO } },
    },
    facilitatorClient,
    [{ network: NETWORK, server: stellarScheme }],
  ),
)

app.get('/search', async (req, res) => {
  const query = req.query.q || ''
  if (!query) return res.status(400).json({ error: 'Missing query parameter: q' })
  console.log('[x402] Search paid and served: ' + query)
  const q = query.toLowerCase()
  let results = []
  if (q.includes('defi') || q.includes('protocol') || q.includes('yield') || q.includes('stellar')) {
    results = [
      { title: 'Blend Protocol', snippet: 'Universal liquidity protocol on Stellar. USDC pools at 6.2% APY.', url: 'https://blend.capital' },
      { title: 'Soroswap DEX',   snippet: 'Leading AMM DEX on Stellar. XLM/USDC TVL at 2.1M USD.', url: 'https://soroswap.finance' },
      { title: 'Phoenix AMM',    snippet: 'Concentrated liquidity AMM on Stellar. USDC yields 8-15% APY.', url: 'https://phoenix-hub.io' },
    ]
  } else {
    results = [{ title: 'Stellar Ecosystem: ' + query, snippet: 'Research on ' + query, url: 'https://developers.stellar.org' }]
  }
  res.json({ query, results, paid: true, network: NETWORK })
})

app.get('/data', async (req, res) => {
  const type = req.query.type || 'general'
  console.log('[x402] Data paid and served: ' + type)
  const data = type === 'defi'
    ? { protocols: [{ name: 'Blend', tvl: '4.2M', apy: '6.2%' }, { name: 'Soroswap', tvl: '2.1M', apy: '4.8%' }, { name: 'Phoenix', tvl: '1.8M', apy: '8-15%' }], timestamp: new Date().toISOString() }
    : { message: 'Stellar data', timestamp: new Date().toISOString() }
  res.json({ type, data, paid: true, network: NETWORK })
})

app.listen(Number(PORT), () => {
  console.log('Hive x402 Tool Server started')
  console.log('Port:        ' + PORT)
  console.log('Network:     ' + NETWORK)
  console.log('Pay-to:      ' + PAY_TO)
  console.log('Facilitator: ' + FACILITATOR)
})
