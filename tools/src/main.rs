//! Hive API Server
//!
//! Acts as the coordination layer between the React frontend and the agent.
//!
//! Responsibilities:
//!   - Accept task submissions from the frontend
//!   - Serve open tasks to the polling agent
//!   - Receive completed results from the agent
//!   - Serve results back to the frontend
//!
//! All state is held in memory for the MVP.
//! Production would use a persistent database.

use axum::{
    extract::{Path, State},
    http::Method,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    sync::{Arc, RwLock},
};
use tower_http::cors::CorsLayer;
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub task_id:     String,
    pub description: String,
    pub bounty:      i128,
    pub deadline:    u64,
    pub status:      String,
    pub poster:      String,
    pub result:      Option<String>,
    pub output_hash: Option<String>,
    pub tx_hash:     Option<String>,
    pub created_at:  i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskRequest {
    pub description: String,
    pub bounty:      i128,
    pub deadline:    u64,
    pub poster:      String,
}

#[derive(Debug, Deserialize)]
pub struct SubmitResultRequest {
    pub task_id:     String,
    pub result:      String,
    pub output_hash: String,
    pub tx_hash:     String,
}

pub type TaskStore = Arc<RwLock<HashMap<String, Task>>>;

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();

    tracing_subscriber::fmt()
        .with_target(false)
        .compact()
        .init();

    let store: TaskStore = Arc::new(RwLock::new(HashMap::new()));

    let cors = CorsLayer::new()
        .allow_origin(tower_http::cors::Any)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(tower_http::cors::Any);

    let app = Router::new()
        .route("/health",                get(health))
        .route("/tasks",                 post(create_task))
        .route("/tasks/open",            get(get_open_tasks))
        .route("/tasks/all",             get(get_all_tasks))
        .route("/tasks/:task_id",        get(get_task))
        .route("/tasks/:task_id/result", post(submit_result))
        .with_state(store)
        .layer(cors);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".into());
    let addr = format!("0.0.0.0:{}", port);

    info!("Hive API server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "service": "hive-api" }))
}

async fn create_task(
    State(store): State<TaskStore>,
    Json(req): Json<CreateTaskRequest>,
) -> Json<Task> {
    let task_id = uuid::Uuid::new_v4().to_string();
    let now     = chrono::Utc::now().timestamp();

    let task = Task {
        task_id:     task_id.clone(),
        description: req.description,
        bounty:      req.bounty,
        deadline:    req.deadline,
        status:      "open".into(),
        poster:      req.poster,
        result:      None,
        output_hash: None,
        tx_hash:     None,
        created_at:  now,
    };

    info!(task_id = %task_id, "Task created");
    store.write().unwrap().insert(task_id, task.clone());
    Json(task)
}

async fn get_open_tasks(State(store): State<TaskStore>) -> Json<Vec<Task>> {
    let tasks = store
        .read()
        .unwrap()
        .values()
        .filter(|t| t.status == "open")
        .cloned()
        .collect();
    Json(tasks)
}

async fn get_all_tasks(State(store): State<TaskStore>) -> Json<Vec<Task>> {
    let tasks = store
        .read()
        .unwrap()
        .values()
        .cloned()
        .collect();
    Json(tasks)
}

async fn get_task(
    State(store): State<TaskStore>,
    Path(task_id): Path<String>,
) -> Json<Option<Task>> {
    let task = store.read().unwrap().get(&task_id).cloned();
    Json(task)
}

async fn submit_result(
    State(store): State<TaskStore>,
    Path(task_id): Path<String>,
    Json(req): Json<SubmitResultRequest>,
) -> Json<serde_json::Value> {
    let mut store = store.write().unwrap();

    if let Some(task) = store.get_mut(&task_id) {
        task.status      = "completed".into();
        task.result      = Some(req.result);
        task.output_hash = Some(req.output_hash);
        task.tx_hash     = Some(req.tx_hash);

        info!(task_id = %task_id, "Result submitted — task completed");
        Json(serde_json::json!({ "status": "ok", "task_id": task_id }))
    } else {
        Json(serde_json::json!({ "status": "error", "message": "task not found" }))
    }
}
