#![no_std]

// ============================================================
// HIVE — Soroban Smart Contract
// The Internet of Agent Labor
//
// Humans post tasks. AI agents do the work.
// Stellar settles the payment. No human in the loop.
//
// Contract responsibilities:
//   - Escrow: lock and auto-release USDC bounties
//   - Registry: track all tasks and their lifecycle
//   - Reputation: build agent trust scores on-chain
//   - Policy: enforce spending limits and timelocks
//   - Events: emit attestations at every stage
// ============================================================

mod escrow;
mod events;
mod policy;
mod registry;
mod reputation;

use soroban_sdk::{
    contract, contractimpl, Address, Env, String, Symbol,
};

pub use registry::{Task, TaskStatus};
pub use reputation::AgentReputation;
pub use policy::SpendingPolicy;

#[contract]
pub struct HiveContract;

#[contractimpl]
impl HiveContract {

    // ----------------------------------------------------------
    // TASK LIFECYCLE
    // ----------------------------------------------------------

    /// Post a new task with USDC bounty locked in escrow
    /// Called by human via Freighter wallet
    pub fn post_task(
        env:      Env,
        task_id:  Symbol,
        poster:   Address,
        bounty:   i128,
        deadline: u64,
        token:    Address,
    ) {
        escrow::post_task(&env, task_id, poster, bounty, deadline, token);
    }

    /// Agent autonomously accepts an open task
    pub fn accept_task(
        env:     Env,
        task_id: Symbol,
        agent:   Address,
    ) {
        escrow::accept_task(&env, task_id, agent);
    }

    /// Agent records an x402 micropayment for a tool used
    pub fn record_tool_payment(
        env:     Env,
        task_id: Symbol,
        agent:   Address,
        tool:    Symbol,
        amount:  i128,
    ) {
        escrow::record_tool_payment(&env, task_id, agent, tool, amount);
    }

    /// Agent submits result — triggers automatic USDC release
    /// Zero human involvement — fully autonomous settlement
    pub fn submit_result(
        env:         Env,
        task_id:     Symbol,
        agent:       Address,
        output_hash: String,
        token:       Address,
    ) {
        escrow::submit_result(&env, task_id, agent, output_hash, token);
    }

    /// Refund poster if task expires without completion
    /// Trustless — anyone can call after deadline
    pub fn refund_expired_task(
        env:     Env,
        task_id: Symbol,
        token:   Address,
    ) {
        escrow::refund_expired_task(&env, task_id, token);
    }

    // ----------------------------------------------------------
    // READ FUNCTIONS
    // ----------------------------------------------------------

    /// Get full task details by ID
    pub fn get_task(env: Env, task_id: Symbol) -> Task {
        registry::get_task(&env, &task_id)
    }

    /// Get total tasks ever posted on Hive
    pub fn get_task_count(env: Env) -> u32 {
        registry::get_task_count(&env)
    }

    /// Get agent reputation record
    pub fn get_reputation(env: Env, agent: Address) -> AgentReputation {
        reputation::get_reputation(&env, &agent)
    }

    /// Get agent success rate (0-100)
    pub fn get_success_rate(env: Env, agent: Address) -> u32 {
        let rep = reputation::get_reputation(&env, &agent);
        reputation::success_rate(&rep)
    }

    /// Get agent spending policy
    pub fn get_spending_policy(env: Env, agent: Address) -> SpendingPolicy {
        policy::get_policy(&env, &agent)
    }

    /// Check if agent can spend amount (respects daily limit)
    pub fn can_agent_spend(env: Env, agent: Address, amount: i128) -> bool {
        policy::can_spend(&env, &agent, amount)
    }

    /// Check if a task has expired
    pub fn is_task_expired(env: Env, task_id: Symbol) -> bool {
        let task = registry::get_task(&env, &task_id);
        policy::is_expired(&env, task.deadline)
    }
}
