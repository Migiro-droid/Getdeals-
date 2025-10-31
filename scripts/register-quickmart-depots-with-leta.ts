import 'dotenv/config';
import axios, { AxiosError } from 'axios';

interface QuickmartOutlet {
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface DepotPayload {
  name: string;
  code: string;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  pickup_geofence_type: string;
  pickup_geofence_radius: number;
  dropoff_geofence_type: string;
  dropoff_geofence_radius: number;
  order_pickup_ready: boolean;
  restricted_radius: number;
  order_wait_time: number;
  max_orders: number;
}

interface DepotResponse {
  status_code: number;
  success: boolean;
  data?: {
    id: string;
    code: string;
    name: string;
  };
  message?: string;
  error?: string;
}

// Quickmart outlets data extracted from the codebase
const QUICKMART_OUTLETS: QuickmartOutlet[] = [
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
  },
  {
    name: 'Quickmart Kilimani',
    code: 'QUICK_NAIROBI_KILIMANI',
    latitude: -1.3032,
    longitude: 36.7784,
    address: 'Kilimani Centre, Ngong Road, Nairobi, Kenya'
  },
  {
    name: 'Quickmart Ruaka',
    code: 'QUICK_NAIROBI_RUAKA',
    latitude: -1.2508,
    longitude: 36.9003,
    address: 'Ruaka Shopping Centre, Kiambu Road, Nairobi, Kenya'
  }
];

/**
 * Create a depot payload from outlet data
 */
function createDepotPayload(outlet: QuickmartOutlet): DepotPayload {
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


async function registerDepot(
  outlet: QuickmartOutlet,
  token: string,
  apiUrl: string,
  maxRetries: number = 3
): Promise<{ success: boolean; depotId?: string; error?: string }> {
  const payload = createDepotPayload(outlet);
  let lastError: string = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `\n[${attempt}/${maxRetries}] Registering depot: ${outlet.code}...`
      );

      const response = await axios.post<DepotResponse>(
        `${apiUrl}/depots/create/`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.status_code === 200 || response.data.success) {
        const depotId = response.data.data?.id || 'unknown';
        console.log(` Success: ${outlet.code} (ID: ${depotId})`);
        return { success: true, depotId };
      } else {
        lastError = response.data.message || response.data.error || 'Unknown error';
        console.warn(
          ` Attempt ${attempt} failed: ${outlet.code} - ${lastError}`
        );
      }
    } catch (error: any) {
      lastError = error.message || 'Unknown error';
      const errorDetails = error.response?.data || {};

      if (error.response) {
        console.error(
          ` Attempt ${attempt} error: ${outlet.code} - Status ${error.response.status}`
        );
        console.error(`Response:`, JSON.stringify(errorDetails, null, 2));
      } else {
        console.error(` Attempt ${attempt} error: ${outlet.code} - ${lastError}`);
      }

      if (attempt < maxRetries) {
        const waitTime = 1000 * attempt;
        console.log(` Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error(
    ` Failed after ${maxRetries} attempts: ${outlet.code} - ${lastError}`
  );
  return { success: false, error: lastError };
}


async function registerAllDepots() {
  const token = process.env.VITE_LETA_TOKEN || process.env.LETA_API_TOKEN;
  const apiUrl = process.env.VITE_LETA_API_URL || 'https://integrations.leta.ai';

  if (!token) {
    console.error('❌ Error: VITE_LETA_TOKEN or LETA_API_TOKEN environment variable is not set');
    console.error('Please set VITE_LETA_TOKEN in your .env file');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 Quickmart Depot Registration with Leta API');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`API URL: ${apiUrl}`);
  console.log(`Total outlets to register: ${QUICKMART_OUTLETS.length}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = {
    successful: [] as Array<{ code: string; depotId: string }>,
    failed: [] as Array<{ code: string; error: string }>
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
  const resultsFile = 'scripts/depot-registration-results.json';
  try {
    const fs = require('fs');
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
