use soroban_sdk::{contracttype, symbol_short, Address, Env, String, Symbol};

// ============================================================
// HIVE — Task Registry
// On-chain registry of all tasks posted to the platform
// Agents poll this to discover available work
// ============================================================

/// All possible states a task can be in
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum TaskStatus {
    Open,        // Posted, waiting for agent
    InProgress,  // Agent accepted, working
    Delivered,   // Agent submitted result
    Completed,   // Escrow released, fully settled
    Refunded,    // Deadline missed, poster refunded
    Disputed,    // Reserved for future use
}

/// Full task record stored on-chain
#[contracttype]
#[derive(Clone)]
pub struct Task {
    pub task_id:    Symbol,    // Unique task identifier
    pub poster:     Address,   // Human who posted the task
    pub agent:      Address,   // Agent assigned (zero addr if open)
    pub bounty:     i128,      // USDC bounty amount (in stroops)
    pub deadline:   u64,       // Unix timestamp — auto-refund after this
    pub status:     TaskStatus,
    pub output_hash: String,   // Hash of delivered result (set on delivery)
    pub created_at: u64,       // Block timestamp when posted
    pub accepted_at: u64,      // Block timestamp when accepted
    pub delivered_at: u64,     // Block timestamp when delivered
}

// Storage keys
const TASK_KEY: Symbol = symbol_short!("TASK");
const TASK_COUNT: Symbol = symbol_short!("TCOUNT");

/// Store a task on-chain
pub fn save_task(env: &Env, task: &Task) {
    env.storage()
        .persistent()
        .set(&(TASK_KEY, task.task_id.clone()), task);
}

/// Retrieve a task by ID — panics if not found
pub fn get_task(env: &Env, task_id: &Symbol) -> Task {
    env.storage()
        .persistent()
        .get(&(TASK_KEY, task_id.clone()))
        .expect("Task not found")
}

/// Check if a task exists
pub fn task_exists(env: &Env, task_id: &Symbol) -> bool {
    env.storage()
        .persistent()
        .has(&(TASK_KEY, task_id.clone()))
}

/// Update task status
pub fn update_task_status(env: &Env, task_id: &Symbol, status: TaskStatus) {
    let mut task = get_task(env, task_id);
    task.status = status;
    save_task(env, &task);
}

/// Assign agent to task
pub fn assign_agent(env: &Env, task_id: &Symbol, agent: &Address, timestamp: u64) {
    let mut task = get_task(env, task_id);
    task.agent = agent.clone();
    task.status = TaskStatus::InProgress;
    task.accepted_at = timestamp;
    save_task(env, &task);
}

/// Record delivery on task
pub fn record_delivery(
    env: &Env,
    task_id: &Symbol,
    output_hash: String,
    timestamp: u64,
) {
    let mut task = get_task(env, task_id);
    task.output_hash = output_hash;
    task.status = TaskStatus::Delivered;
    task.delivered_at = timestamp;
    save_task(env, &task);
}

/// Increment global task counter
pub fn increment_task_count(env: &Env) -> u32 {
    let count: u32 = env
        .storage()
        .persistent()
        .get(&TASK_COUNT)
        .unwrap_or(0);
    let new_count = count + 1;
    env.storage().persistent().set(&TASK_COUNT, &new_count);
    new_count
}

/// Get total tasks posted
pub fn get_task_count(env: &Env) -> u32 {
    env.storage()
        .persistent()
        .get(&TASK_COUNT)
        .unwrap_or(0)
}
