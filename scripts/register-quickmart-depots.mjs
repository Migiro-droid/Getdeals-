#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Quickmart outlets data
const QUICKMART_OUTLETS = [
  {
    name: 'Quickmart Westlands',
    code: 'QUICK_NAIROBI_WESTLANDS',
    latitude: -1.2634,
    longitude: 36.8078,
    address: 'Westlands Square, Waiyaki Way, Nairobi, Kenya'
  },
  {
    name: 'Quickmart Roysambu',
    code: 'QUICK_NAIROBI_ROYSAMBU',
    latitude: -1.2097,
    longitude: 36.8833,
    address: 'Roysambu Roundabout, Thika Road, Nairobi, Kenya'
  },
  {
    name: 'Quickmart Lavington',
    code: 'QUICK_NAIROBI_LAVINGTON',
    latitude: -1.2774,
    longitude: 36.7664,
    address: 'Lavington Green Shopping Centre, Hatheru Road, Nairobi, Kenya'
  },
  {
    name: 'Quickmart Thindiuga',
    code: 'QUICK_NAIROBI_THINDIUGA',
    latitude: -1.2303,
    longitude: 36.8647,
    address: 'Thindiuga Shopping Centre, Kiambu Road, Nairobi, Kenya'
  },
  {
    name: 'Quickmart Mombasa Road',
    code: 'QUICK_NAIROBI_MOMBASA_ROAD',
    latitude: -1.3201,
    longitude: 36.8585,
    address: 'Mombasa Road, Industrial Area, Nairobi, Kenya'
  },
  {
    name: 'Quickmart Karen',
    code: 'QUICK_NAIROBI_KAREN',
    latitude: -1.3197,
    longitude: 36.7019,
    address: 'Karen Shopping Centre, Karen Road, Nairobi, Kenya'
  },
  {
    name: 'Quickmart CBD',
    code: 'QUICK_NAIROBI_CBD',
    latitude: -1.2864,
    longitude: 36.8172,
    address: 'Nairobi CBD, Waiyaki Way, Nairobi, Kenya'
  },
  {
    name: 'Quickmart Eastlands',
    code: 'QUICK_NAIROBI_EASTLANDS',
    latitude: -1.2500,
    longitude: 36.8833,
    address: 'Eastlands Mall, Juja Road, Nairobi, Kenya'
  }
];

/**
 * Create a depot payload from outlet data
 */
function createDepotPayload(outlet) {
  return {
    name: outlet.name,
    code: outlet.code,
    location: {
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      name: outlet.address
    },
    pickup_geofence_type: 'soft',
    pickup_geofence_radius: 500,
    dropoff_geofence_type: 'soft',
    dropoff_geofence_radius: 500,
    order_pickup_ready: false,
    restricted_radius: 1000,
    order_wait_time: 15,
    max_orders: 1
  };
}

/**
 * Register a single depot with retry logic
 */
async function registerDepot(outlet, token, apiUrl, maxRetries = 3) {
  const payload = createDepotPayload(outlet);
  let lastError = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `\n[${attempt}/${maxRetries}] Registering depot: ${outlet.code}...`
      );

      const response = await fetch(`${apiUrl}/depots/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        timeout: 30000
      });

      const data = await response.json();

      if (response.status === 200 || data.success) {
        const depotId = data.data?.id || 'unknown';
        console.log(`✅ Success: ${outlet.code} (ID: ${depotId})`);
        return { success: true, depotId };
      } else {
        lastError = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
        console.warn(
          `⚠️  Attempt ${attempt} failed: ${outlet.code} - ${lastError}`
        );
        // Log response for debugging
        console.debug(`     Response: ${JSON.stringify(data).substring(0, 200)}`);
      }
    } catch (error) {
      lastError = error.message || 'Unknown error';
      console.error(
        `❌ Attempt ${attempt} error: ${outlet.code} - ${lastError}`
      );

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = 1000 * attempt;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error(
    `❌ Failed after ${maxRetries} attempts: ${outlet.code} - ${lastError}`
  );
  return { success: false, error: lastError };
}

/**
 * Main function to register all depots
 */
async function registerAllDepots() {
  const token = process.env.LETA_API_TOKEN;
  const apiUrl = process.env.VITE_LETA_API_URL || 'https://integrations.leta.ai';

  if (!token) {
    console.error('❌ Error: LETA_API_TOKEN environment variable is not set');
    console.error('Please set LETA_API_TOKEN in your .env file');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 Quickmart Depot Registration with Leta API');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`API URL: ${apiUrl}`);
  console.log(`Total outlets to register: ${QUICKMART_OUTLETS.length}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = {
    successful: [],
    failed: []
  };

  // Register each depot
  for (const outlet of QUICKMART_OUTLETS) {
    const result = await registerDepot(outlet, token, apiUrl);

    if (result.success && result.depotId) {
      results.successful.push({
        code: outlet.code,
        depotId: result.depotId
      });
    } else {
      results.failed.push({
        code: outlet.code,
        error: result.error || 'Unknown error'
      });
    }

    // Small delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary Report
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 Registration Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Successful: ${results.successful.length}/${QUICKMART_OUTLETS.length}`);
  console.log(`❌ Failed: ${results.failed.length}/${QUICKMART_OUTLETS.length}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (results.successful.length > 0) {
    console.log('✅ Successfully Registered Depots:');
    console.log('───────────────────────────────────────────────────────────');
    results.successful.forEach(({ code, depotId }) => {
      console.log(`  • ${code}: ${depotId}`);
    });
    console.log();
  }

  if (results.failed.length > 0) {
    console.log('❌ Failed Registrations:');
    console.log('───────────────────────────────────────────────────────────');
    results.failed.forEach(({ code, error }) => {
      console.log(`  • ${code}: ${error}`);
    });
    console.log();
  }

  // Save results to file
  const resultsFile = path.join(__dirname, 'depot-registration-results.json');
  try {
    fs.writeFileSync(
      resultsFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          apiUrl,
          summary: {
            total: QUICKMART_OUTLETS.length,
            successful: results.successful.length,
            failed: results.failed.length
          },
          results
        },
        null,
        2
      )
    );
    console.log(`📁 Results saved to: ${resultsFile}\n`);
  } catch (err) {
    console.error(`Failed to save results file: ${err}\n`);
  }

  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run the registration
registerAllDepots().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
