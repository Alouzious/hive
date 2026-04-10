//! Search Tool — x402 Wrapper
//!
//! Provides web search capability to the Hive agent via x402 micropayments.
//! The agent pays per query in USDC on Stellar — no subscription required.
//!
//! Endpoint: xlm402.com (Stellar testnet x402 demo service)
//! Cost: ~$0.001 USDC per query
//!
//! Reference: https://xlm402.com

use anyhow::Result;
use serde::Deserialize;
use std::env;
use tracing::{debug, info};

#[derive(Debug, Deserialize)]
pub struct SearchResult {
    pub title:   String,
    pub url:     String,
    pub snippet: String,
}

#[derive(Debug, Deserialize)]
pub struct SearchResponse {
    pub results: Vec<SearchResult>,
    pub query:   String,
}

/// Execute a paid search query via x402 on Stellar.
///
/// This function demonstrates the core x402 value proposition:
/// the agent pays only for what it uses — no API key, no subscription.
pub async fn query(search_query: &str) -> Result<String> {
    let tool_url = env::var("X402_TOOL_URL")
        .unwrap_or_else(|_| "https://xlm402.com".into());

    let endpoint = format!("{}/search?q={}", tool_url, urlencoding(search_query));

    info!(
        query    = %search_query,
        endpoint = %endpoint,
        "Initiating x402 paid search query"
    );

    // This triggers the full x402 payment cycle:
    // GET /search -> 402 -> sign USDC on Stellar -> retry -> 200 OK
    let raw_response = crate::x402::get(&endpoint).await?;

    debug!(response_len = raw_response.len(), "Search response received");

    // Parse response — fall back to raw text if not JSON
    let formatted = match serde_json::from_str::<SearchResponse>(&raw_response) {
        Ok(parsed) => format_results(&parsed),
        Err(_)     => raw_response,
    };

    Ok(formatted)
}

/// Format search results into a readable report section.
fn format_results(response: &SearchResponse) -> String {
    if response.results.is_empty() {
        return format!("No results found for: {}", response.query);
    }

    let lines: Vec<String> = response
        .results
        .iter()
        .map(|r| format!("- {}\n  {}\n  {}", r.title, r.snippet, r.url))
        .collect();

    lines.join("\n\n")
}

/// Simple URL encoding for query strings.
fn urlencoding(input: &str) -> String {
    input
        .chars()
        .map(|c| match c {
            ' '  => "+".to_string(),
            c if c.is_alphanumeric() || "-_.~".contains(c) => c.to_string(),
            c    => format!("%{:02X}", c as u32),
        })
        .collect()
}
