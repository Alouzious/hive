use soroban_sdk::{contracttype, symbol_short, Address, Env, Symbol};

// ============================================================
// HIVE — Agent Reputation Registry
// Every agent builds an on-chain reputation over time
// Task posters can verify agent history before posting work
// ============================================================

/// Reputation record for a single agent
#[contracttype]
#[derive(Clone)]
pub struct AgentReputation {
    pub agent:            Address,  // Agent wallet address
    pub tasks_completed:  u32,      // Total tasks successfully delivered
    pub tasks_failed:     u32,      // Tasks missed or refunded
    pub total_earned:     i128,     // Total USDC earned (in stroops)
    pub total_spent:      i128,     // Total USDC spent on x402 tools
    pub registered_at:   u64,      // When agent first appeared on Hive
    pub last_active:      u64,      // Last task completion timestamp
}

// Storage key prefix for reputation records
const REP_KEY: Symbol = symbol_short!("REP");

/// Save or update agent reputation
pub fn save_reputation(env: &Env, rep: &AgentReputation) {
    env.storage()
        .persistent()
        .set(&(REP_KEY, rep.agent.clone()), rep);
}

/// Get agent reputation — returns default if first time
pub fn get_reputation(env: &Env, agent: &Address) -> AgentReputation {
    env.storage()
        .persistent()
        .get(&(REP_KEY, agent.clone()))
        .unwrap_or(AgentReputation {
            agent:           agent.clone(),
            tasks_completed: 0,
            tasks_failed:    0,
            total_earned:    0,
            total_spent:     0,
            registered_at:   env.ledger().timestamp(),
            last_active:     0,
        })
}

/// Record a successful task completion
pub fn record_completion(
    env: &Env,
    agent: &Address,
    bounty_earned: i128,
    tools_spent: i128,
) {
    let mut rep = get_reputation(env, agent);
    rep.tasks_completed += 1;
    rep.total_earned    += bounty_earned;
    rep.total_spent     += tools_spent;
    rep.last_active      = env.ledger().timestamp();
    save_reputation(env, &rep);
}

/// Record a failed task (deadline missed)
pub fn record_failure(env: &Env, agent: &Address) {
    let mut rep = get_reputation(env, agent);
    rep.tasks_failed += 1;
    rep.last_active   = env.ledger().timestamp();
    save_reputation(env, &rep);
}

/// Record x402 tool spend against agent
pub fn record_tool_spend(env: &Env, agent: &Address, amount: i128) {
    let mut rep = get_reputation(env, agent);
    rep.total_spent += amount;
    save_reputation(env, &rep);
}

/// Calculate agent success rate as percentage (0-100)
pub fn success_rate(rep: &AgentReputation) -> u32 {
    let total = rep.tasks_completed + rep.tasks_failed;
    if total == 0 {
        return 100; // New agent starts at 100%
    }
    (rep.tasks_completed * 100) / total
}
