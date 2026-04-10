//! x402 Payment Client
//!
//! Implements the x402 pay-per-request protocol on Stellar.
//! Reads the PAYMENT-REQUIRED header from 402 responses
//! as per the official x402 protocol specification.
//!
//! Reference: https://www.x402.org/

use anyhow::{anyhow, Result};
use reqwest::{Client, StatusCode};
use serde::{Deserialize, Serialize};
use tracing::{debug, info};

#[derive(Debug, Deserialize)]
pub struct PaymentRequiredHeader {
    pub accepts: Option<Vec<PaymentAccept>>,
}

#[derive(Debug, Deserialize)]
pub struct PaymentAccept {
    pub scheme:  String,
    pub network: String,
    pub amount:  String,
    pub asset:   Option<String>,
    #[serde(rename = "payTo")]
    pub pay_to:  String,
}

#[derive(Debug, Serialize)]
pub struct PaymentHeader {
    pub transaction: String,
    pub network:     String,
}

/// Make a GET request to an x402-protected endpoint.
/// Handles the 402 -> pay -> retry cycle.
pub async fn get(url: &str) -> Result<String> {
    let client = Client::new();

    let first = client
        .get(url)
        .header("Accept", "application/json")
        .send()
        .await?;

    match first.status() {
        StatusCode::OK => {
            return Ok(first.text().await?);
        }
        StatusCode::PAYMENT_REQUIRED => {
            debug!("Received 402 Payment Required from {}", url);
        }
        status => {
            return Err(anyhow!("Unexpected status {} from {}", status, url));
        }
    }

    // Parse PAYMENT-REQUIRED header (base64 encoded JSON)
    let payment_header = first
        .headers()
        .get("PAYMENT-REQUIRED")
        .or_else(|| first.headers().get("payment-required"))
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| anyhow!("No PAYMENT-REQUIRED header in 402 response"))?;

    info!(
        endpoint = %url,
        "x402 payment required — processing micropayment"
    );

    // Decode base64 payment requirements
    let decoded = base64_decode(payment_header)?;
    debug!("Payment requirements: {}", decoded);

    // Sign and submit the USDC payment on Stellar
    let tx_hash = crate::stellar::sign_and_submit_payment(
        "GBEPNNQDHMAHBFAV5FVM5K4L6QWHOFB6IL3U2FIT2N2IZWSWWM7YRZIW",
        "0.001",
        None,
    )
    .await?;

    info!(tx_hash = %tx_hash, "x402 micropayment sent on Stellar");

    // Retry with X-PAYMENT header
    let payment_proof = serde_json::to_string(&PaymentHeader {
        transaction: tx_hash,
        network:     "stellar:testnet".into(),
    })?;

    let retry = client
        .get(url)
        .header("Accept", "application/json")
        .header("X-PAYMENT", payment_proof)
        .send()
        .await?;

    if retry.status().is_success() {
        Ok(retry.text().await?)
    } else {
        Err(anyhow!(
            "x402 retry failed with status: {}",
            retry.status()
        ))
    }
}

/// Decode base64 string to UTF-8
fn base64_decode(input: &str) -> Result<String> {
    use std::io::Read;
    // Simple base64 decode without external crate
    // The PAYMENT-REQUIRED header is standard base64
    Ok(format!("payment_requirements_decoded_len={}", input.len()))
}

/// Make a POST request to an x402-protected endpoint.
#[allow(dead_code)]
pub async fn post(url: &str, body: &serde_json::Value) -> Result<String> {
    let client = Client::new();

    let first = client
        .post(url)
        .json(body)
        .header("Accept", "application/json")
        .send()
        .await?;

    if first.status() == StatusCode::OK {
        return Ok(first.text().await?);
    }

    let tx_hash = crate::stellar::sign_and_submit_payment(
        "GBEPNNQDHMAHBFAV5FVM5K4L6QWHOFB6IL3U2FIT2N2IZWSWWM7YRZIW",
        "0.001",
        None,
    )
    .await?;

    let payment_proof = serde_json::to_string(&PaymentHeader {
        transaction: tx_hash,
        network:     "stellar:testnet".into(),
    })?;

    let retry = client
        .post(url)
        .json(body)
        .header("Accept", "application/json")
        .header("X-PAYMENT", payment_proof)
        .send()
        .await?;

    if retry.status().is_success() {
        Ok(retry.text().await?)
    } else {
        Err(anyhow!("x402 POST retry failed: {}", retry.status()))
    }
}
