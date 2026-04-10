use soroban_sdk::{contracttype, symbol_short, Address, Env, String, Symbol};

// ============================================================
// HIVE — On-Chain Event Definitions
// Every stage of the task lifecycle emits an attestation event
// These events are permanent, immutable, and publicly verifiable
// ============================================================

/// Emitted when a human posts a new task and locks USDC in escrow
pub fn emit_task_posted(
    env: &Env,
    task_id: Symbol,
    poster: Address,
    bounty: i128,
    deadline: u64,
) {
    env.events().publish(
        (symbol_short!("POSTED"), task_id.clone()),
        (poster, bounty, deadline),
    );
}

/// Emitted when an agent autonomously accepts a task
pub fn emit_task_accepted(
    env: &Env,
    task_id: Symbol,
    agent: Address,
    timestamp: u64,
) {
    env.events().publish(
        (symbol_short!("ACCEPTED"), task_id.clone()),
        (agent, timestamp),
    );
}

/// Emitted for every x402 micropayment the agent makes for a tool
pub fn emit_tool_paid(
    env: &Env,
    task_id: Symbol,
    agent: Address,
    tool: Symbol,
    amount: i128,
) {
    env.events().publish(
        (symbol_short!("TOOLPAID"), task_id.clone()),
        (agent, tool, amount),
    );
}

/// Emitted when agent delivers completed work
pub fn emit_result_delivered(
    env: &Env,
    task_id: Symbol,
    agent: Address,
    output_hash: String,
    timestamp: u64,
) {
    env.events().publish(
        (symbol_short!("DELIVERED"), task_id.clone()),
        (agent, output_hash, timestamp),
    );
}

/// Emitted when Soroban auto-releases USDC bounty to agent
pub fn emit_escrow_released(
    env: &Env,
    task_id: Symbol,
    agent: Address,
    amount: i128,
) {
    env.events().publish(
        (symbol_short!("RELEASED"), task_id.clone()),
        (agent, amount),
    );
}

/// Emitted when escrow is refunded to poster (deadline missed / task failed)
pub fn emit_task_refunded(
    env: &Env,
    task_id: Symbol,
    poster: Address,
    amount: i128,
    reason: Symbol,
) {
    env.events().publish(
        (symbol_short!("REFUNDED"), task_id.clone()),
        (poster, amount, reason),
    );
}

/// Emitted when agent reputation is updated after task completion
pub fn emit_reputation_updated(
    env: &Env,
    agent: Address,
    tasks_completed: u32,
    total_earned: i128,
) {
    env.events().publish(
        (symbol_short!("REPUPDATE"), agent.clone()),
        (tasks_completed, total_earned),
    );
}
