"use strict";
import "dotenv/config";

const PHONE_NUMBER = process.env.MPESA_TEST_PHONE || "254706802833"
const AMOUNT = 1;
const ACCOUNT_REFERENCE = "TEST123";

const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL,
} = process.env;

const MPESA_ENVIRONMENT = process.env.MPESA_ENVIRONMENT || "production";

if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
  console.error("Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET in the environment.");
  process.exit(1);
}

if (!MPESA_SHORTCODE) {
  console.error("Missing MPESA_SHORTCODE in the environment.");
  process.exit(1);
}

if (!MPESA_PASSKEY) {
  console.error("Missing MPESA_PASSKEY in the environment.");
  process.exit(1);
}

if (!MPESA_CALLBACK_URL) {
  console.error("Missing MPESA_CALLBACK_URL in the environment.");
  process.exit(1);
}

const BASE_URL = MPESA_ENVIRONMENT === "production"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

function getNairobiTimestamp() {
  const now = new Date();
  const localeString = now.toLocaleString("en-GB", { timeZone: "Africa/Nairobi", hour12: false });
  const [datePart, timePart] = localeString.split(", ");
  const [day, month, year] = datePart.split("/");
  const [hour, minute, second] = timePart.split(":");
  return `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}${hour}${minute}${second}`;
}

function formatPhone(raw) {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) {
    return `254${digits.slice(1)}`;
  }
  if (digits.startsWith("254")) {
    return digits;
  }
  return `254${digits}`;
}

async function generateAccessToken() {
  const credentials = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");
  const url = `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to obtain access token (check MPESA_CONSUMER_KEY/MPESA_CONSUMER_SECRET). Status ${response.status}: ${text}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Access token missing in response. Verify consumer key/secret.");
  }

  return data.access_token;
}

async function sendStkPush(accessToken) {
  const timestamp = getNairobiTimestamp();
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");
  const formattedPhone = formatPhone(PHONE_NUMBER);

  const url = `${BASE_URL}/mpesa/stkpush/v1/processrequest`;
  const payload = {
    BusinessShortCode: Number(MPESA_SHORTCODE),
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: AMOUNT,
    PartyA: formattedPhone,
    PartyB: Number(MPESA_SHORTCODE),
    PhoneNumber: formattedPhone,
    CallBackURL: MPESA_CALLBACK_URL,
    AccountReference: ACCOUNT_REFERENCE,
    TransactionDesc: "Test STK Push via script",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();
  let json;
  try {
    json = JSON.parse(bodyText);
  } catch (error) {
    json = bodyText;
  }

  if (!response.ok) {
    let hint = "Unknown error. Check logs.";
    if (typeof json === "object" && json) {
      if (json.errorCode === "400.001.02") {
        hint = "Check MPESA_PASSKEY or MPESA_SHORTCODE (password mismatch).";
      } else if (json.errorCode === "400.002.02") {
        hint = "Check MPESA_CALLBACK_URL or transaction parameters.";
      } else if (json.errorCode === "401.001.01") {
        hint = "Access token rejected. Verify credentials or app permissions.";
      }
    }
    throw new Error(`STK Push request failed. ${hint} Response: ${bodyText}`);
  }

  return json;
}

async function queryStkPush(accessToken, checkoutRequestId) {
  const timestamp = getNairobiTimestamp();
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");

  const url = `${BASE_URL}/mpesa/stkpushquery/v1/query`;
  const payload = {
    BusinessShortCode: Number(MPESA_SHORTCODE),
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();
  let json;
  try {
    json = JSON.parse(bodyText);
  } catch (error) {
    json = bodyText;
  }

  if (!response.ok) {
    throw new Error(`STK Query failed. Response: ${bodyText}`);
  }

  return json;
}

(async () => {
  try {
    console.log("Starting M-Pesa production test...");
    const token = await generateAccessToken();
    console.log("Access token acquired:", token);

    const response = await sendStkPush(token);
    console.log("STK Push Response:", response);

    if (response.CheckoutRequestID) {
      console.log("Waiting 20 seconds before querying status...");
      await new Promise((resolve) => setTimeout(resolve, 20000));
      const query = await queryStkPush(token, response.CheckoutRequestID);
      console.log("STK Query Response:", query);
    } else {
      console.log("No CheckoutRequestID returned; skipping query.");
    }
  } catch (error) {
    console.error("M-Pesa production test failed:", error.message);
    process.exit(1);
  }
})();
