//! Hive Agent — Entry Point
//!
//! The Hive agent is an autonomous economic worker that:
//!   1. Polls the task registry for open work
//!   2. Accepts tasks and pays for tools via x402 on Stellar
//!   3. Executes research tasks using paid tool endpoints
//!   4. Submits results and triggers Soroban escrow release
//!
//! Architecture:
//!   - poller    : discovers and accepts open tasks
//!   - executor  : orchestrates task execution
//!   - x402      : handles HTTP 402 payment cycles on Stellar
//!   - stellar   : wallet signing and contract interaction
//!   - tools     : x402-wrapped external services

mod executor;
mod poller;
mod stellar;
mod x402;
mod tools {
    pub mod data;
    pub mod search;
}

use dotenv::dotenv;
use std::env;
use tracing::info;

#[tokio::main]
async fn main() {
    // Load environment variables from .env
    dotenv().ok();

    // Initialize structured logging
    tracing_subscriber::fmt()
        .with_target(false)
        .with_thread_ids(false)
        .compact()
        .init();

    info!("Hive Agent initializing");
    info!(
        network = %env::var("STELLAR_NETWORK").unwrap_or_else(|_| "unknown".into()),
        contract = %env::var("CONTRACT_ID").unwrap_or_else(|_| "not set".into()),
        "Configuration loaded"
    );

    // Start the autonomous task polling loop — runs indefinitely
    poller::start().await;
}
