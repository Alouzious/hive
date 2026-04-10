//! Task Poller
//!
//! Continuously polls the task registry for open work.
//! When a task is found, it is passed to the executor.
//! The polling interval is configurable via POLL_INTERVAL_SECS.

use crate::executor;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::env;
use tokio::time::{sleep, Duration};
use tracing::{error, info, warn};

/// Represents a task retrieved from the registry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub task_id:     String,
    pub description: String,
    pub bounty:      i128,
    pub deadline:    u64,
    pub status:      String,
    pub poster:      String,
}

/// Start the agent polling loop.
/// This runs indefinitely — one iteration every POLL_INTERVAL_SECS seconds.
pub async fn start() {
    let interval = env::var("POLL_INTERVAL_SECS")
        .ok()
        .and_then(|v| v.parse::<u64>().ok())
        .unwrap_or(10);

    info!("Task poller started with {}s interval", interval);

    loop {
        match poll_once().await {
            Ok(0)  => info!("No open tasks found"),
            Ok(n)  => info!("Processed {} task(s) this cycle", n),
            Err(e) => error!("Polling cycle failed: {:#}", e),
        }
        sleep(Duration::from_secs(interval)).await;
    }
}

/// Execute a single polling cycle.
/// Returns the number of tasks picked up this cycle.
async fn poll_once() -> Result<usize> {
    let backend_url = env::var("BACKEND_URL")
        .unwrap_or_else(|_| "http://localhost:3001".into());

    let client = reqwest::Client::new();

    let response = client
        .get(format!("{}/tasks/open", backend_url))
        .timeout(Duration::from_secs(10))
        .send()
        .await?;

    let tasks: Vec<Task> = response.json().await.unwrap_or_default();

    if tasks.is_empty() {
        return Ok(0);
    }

    info!("{} open task(s) available", tasks.len());

    let mut processed = 0;

    for task in tasks {
        info!(
            task_id = %task.task_id,
            bounty  = task.bounty,
            "Accepting task"
        );

        match executor::execute(task).await {
            Ok(_)  => processed += 1,
            Err(e) => warn!("Task execution failed: {:#}", e),
        }
    }

    Ok(processed)
}
