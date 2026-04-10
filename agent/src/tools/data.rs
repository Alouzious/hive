//! Data Tool — x402 Wrapper
//!
//! Provides access to DeFi and blockchain data via x402 micropayments.
//! Reserved for structured data queries beyond web search.
//! Cost: ~$0.001 USDC per call via x402 on Stellar.

use anyhow::Result;
use std::env;
use tracing::info;

/// Fetch data from an x402-protected endpoint.
#[allow(dead_code)]
pub async fn fetch(endpoint: &str, params: &str) -> Result<String> {
    let tool_url = env::var("X402_TOOL_URL")
        .unwrap_or_else(|_| "https://xlm402.com".into());

    let url = format!("{}/{}?{}", tool_url, endpoint, params);

    info!(
        endpoint = %endpoint,
        params   = %params,
        "Initiating x402 paid data fetch"
    );

    crate::x402::get(&url).await
}
