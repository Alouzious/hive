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
    dotenv().ok();

    tracing_subscriber::fmt()
        .with_target(false)
        .with_thread_ids(false)
        .compact()
        .init();

    info!("Hive Agent initializing");
    info!(
        network  = %env::var("STELLAR_NETWORK").unwrap_or_else(|_| "unknown".into()),
        contract = %env::var("CONTRACT_ID").unwrap_or_else(|_| "not set".into()),
        "Configuration loaded"
    );

    // Spawn a minimal HTTP health check server so Render free tier
    // does not kill the service for not binding to a port.
    // The agent itself is a background poller — this is only for hosting.
    tokio::spawn(async {
        let port = std::env::var("PORT").unwrap_or_else(|_| "8080".into());
        let addr = format!("0.0.0.0:{}", port);
        let listener = tokio::net::TcpListener::bind(&addr).await
            .expect("Failed to bind health check port");
        info!("Health check listening on {}", addr);
        loop {
            if let Ok((mut socket, _)) = listener.accept().await {
                tokio::spawn(async move {
                    use tokio::io::AsyncWriteExt;
                    let _ = socket
                        .write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK")
                        .await;
                });
            }
        }
    });

    // Start the autonomous task polling loop — runs indefinitely
    poller::start().await;
}
