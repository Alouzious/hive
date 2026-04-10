use soroban_sdk::{Address, Env, String, Symbol, token};

use crate::{
    events,
    policy,
    registry::{self, Task, TaskStatus},
    reputation,
};

// ============================================================
// HIVE — Escrow Logic
// Core payment flows — deposit, release, refund
// USDC moves trustlessly between human, contract, and agent
// ============================================================

/// Post a new task — locks USDC bounty in escrow
/// Called by human via React dashboard + Freighter wallet
pub fn post_task(
    env:      &Env,
    task_id:  Symbol,
    poster:   Address,
    bounty:   i128,
    deadline: u64,
    token:    Address,
) {
    // Require poster to authorize this transaction
    poster.require_auth();

    // Validate inputs
    policy::validate_bounty(bounty);
    policy::validate_deadline(env, deadline);

    // Ensure task ID is unique
    assert!(
        !registry::task_exists(env, &task_id),
        "Task ID already exists"
    );

    // Transfer USDC from poster to contract (escrow lock)
    let token_client = token::Client::new(env, &token);
    token_client.transfer(&poster, &env.current_contract_address(), &bounty);

    // Create and store task record
    let task = Task {
        task_id:      task_id.clone(),
        poster:       poster.clone(),
        agent:        poster.clone(), // placeholder — overwritten on accept
        bounty,
        deadline,
        status:       TaskStatus::Open,
        output_hash:  String::from_str(env, ""),
        created_at:   env.ledger().timestamp(),
        accepted_at:  0,
        delivered_at: 0,
    };
    registry::save_task(env, &task);
    registry::increment_task_count(env);

    // Emit on-chain attestation event
    events::emit_task_posted(env, task_id, poster, bounty, deadline);
}

/// Agent accepts an open task autonomously
/// Called by agent backend — no human involvement
pub fn accept_task(
    env:     &Env,
    task_id: Symbol,
    agent:   Address,
) {
    // Require agent wallet authorization
    agent.require_auth();

    let task = registry::get_task(env, &task_id);

    // Validate task is available
    assert!(
        task.status == TaskStatus::Open,
        "Task is not open for acceptance"
    );
    assert!(
        !policy::is_expired(env, task.deadline),
        "Task deadline has passed"
    );

    let now = env.ledger().timestamp();
    registry::assign_agent(env, &task_id, &agent, now);

    // Emit on-chain attestation
    events::emit_task_accepted(env, task_id, agent, now);
}

/// Agent records an x402 tool payment
/// Called by agent backend after each micropayment
pub fn record_tool_payment(
    env:     &Env,
    task_id: Symbol,
    agent:   Address,
    tool:    Symbol,
    amount:  i128,
) {
    agent.require_auth();

    let task = registry::get_task(env, &task_id);
    assert!(
        task.status == TaskStatus::InProgress,
        "Task is not in progress"
    );
    assert!(task.agent == agent, "Not the assigned agent");

    // Enforce spending policy — hard limit at contract level
    policy::record_spend(env, &agent, amount);

    // Update reputation spend tracker
    reputation::record_tool_spend(env, &agent, amount);

    // Emit tool payment event
    events::emit_tool_paid(env, task_id, agent, tool, amount);
}

/// Agent submits completed work — triggers auto escrow release
/// This is the fully autonomous settlement — zero human approval
pub fn submit_result(
    env:         &Env,
    task_id:     Symbol,
    agent:       Address,
    output_hash: String,
    token:       Address,
) {
    agent.require_auth();

    let task = registry::get_task(env, &task_id);

    // Validate
    assert!(
        task.status == TaskStatus::InProgress,
        "Task is not in progress"
    );
    assert!(task.agent == agent, "Not the assigned agent");
    assert!(
        !policy::is_expired(env, task.deadline),
        "Task deadline has passed"
    );

    let now = env.ledger().timestamp();

    // Record delivery on-chain
    registry::record_delivery(env, &task_id, output_hash.clone(), now);

    // Emit delivery attestation — permanent on-chain proof
    events::emit_result_delivered(
        env,
        task_id.clone(),
        agent.clone(),
        output_hash,
        now,
    );

    // AUTO-RELEASE ESCROW — no human approval needed
    // This is the core of Hive's trustless economic loop
    let token_client = token::Client::new(env, &token);
    token_client.transfer(
        &env.current_contract_address(),
        &agent,
        &task.bounty,
    );

    // Update task status to completed
    registry::update_task_status(env, &task_id, TaskStatus::Completed);

    // Get tool spend for this task from reputation
    let rep = reputation::get_reputation(env, &agent);

    // Update agent reputation
    reputation::record_completion(env, &agent, task.bounty, rep.total_spent);

    // Emit settlement event
    events::emit_escrow_released(env, task_id.clone(), agent.clone(), task.bounty);
    events::emit_reputation_updated(
        env,
        agent,
        rep.tasks_completed + 1,
        rep.total_earned + task.bounty,
    );
}

/// Refund poster if deadline passes without delivery
/// Can be called by anyone after deadline — trustless
pub fn refund_expired_task(
    env:     &Env,
    task_id: Symbol,
    token:   Address,
) {
    let task = registry::get_task(env, &task_id);

    assert!(
        task.status == TaskStatus::Open
            || task.status == TaskStatus::InProgress,
        "Task already completed or refunded"
    );
    assert!(
        policy::is_expired(env, task.deadline),
        "Task deadline has not passed yet"
    );

    // Transfer USDC back to poster
    let token_client = token::Client::new(env, &token);
    token_client.transfer(
        &env.current_contract_address(),
        &task.poster,
        &task.bounty,
    );

    // Update status
    registry::update_task_status(env, &task_id, TaskStatus::Refunded);

    // If agent was assigned, record failure on their reputation
    if task.status == TaskStatus::InProgress {
        reputation::record_failure(env, &task.agent);
    }

    // Emit refund event
    events::emit_task_refunded(
        env,
        task_id,
        task.poster,
        task.bounty,
        soroban_sdk::symbol_short!("EXPIRED"),
    );
}
