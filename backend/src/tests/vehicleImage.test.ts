/**
 * Vehicle Image Integration Tests
 * Run with: npx tsx src/tests/vehicleImage.test.ts
 */

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';

let passed = 0;
let failed = 0;

function log(msg: string) {
  console.log(msg);
}

function pass(test: string) {
  passed++;
  log(`${GREEN}✓ PASS${RESET}: ${test}`);
}

function fail(test: string, error: string) {
  failed++;
  log(`${RED}✗ FAIL${RESET}: ${test}`);
  log(`  ${RED}Error: ${error}${RESET}`);
}

async function testProxyEndpoint() {
  log('\n--- Testing Backend Proxy Endpoint ---');

  const baseUrl = 'http://localhost:4000';

  try {
    const response = await fetch(`${baseUrl}/api/vehicle-images/proxy/Toyota/Tundra/2006`);

    if (response.ok) {
      pass('Proxy endpoint returns HTTP 200');
    } else {
      fail('Proxy endpoint returns HTTP 200', `HTTP ${response.status}`);
      return;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('image')) {
      pass(`Proxy returns image content-type (${contentType})`);
    } else {
      fail('Proxy returns image content-type', `Got: ${contentType}`);
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 100000) {
      pass(`Proxy returns image data (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      fail('Proxy returns image data', `Only ${buffer.byteLength} bytes`);
    }

  } catch (error) {
    fail('Proxy endpoint', String(error));
  }
}

async function testProxyVehicleIdEndpoint() {
  log('\n--- Testing Backend Proxy Vehicle ID Endpoint ---');

  const baseUrl = 'http://localhost:4000';
  const vehicleId = 'f5428602-efc0-4776-847f-ab70f24db366'; // Toyota Tundra 2006

  try {
    const response = await fetch(`${baseUrl}/api/vehicle-images/proxy/vehicle/${vehicleId}`);

    if (response.ok) {
      pass('Proxy vehicle ID endpoint returns HTTP 200');
    } else {
      fail('Proxy vehicle ID endpoint returns HTTP 200', `HTTP ${response.status}`);
      return;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('image')) {
      pass(`Returns image content-type (${contentType})`);
    } else {
      fail('Returns image content-type', `Got: ${contentType}`);
    }

  } catch (error) {
    fail('Proxy vehicle ID endpoint', String(error));
  }
}

async function testFrontendProxy() {
  log('\n--- Testing Frontend Proxy (port 3000 -> 4000) ---');

  try {
    const response = await fetch('http://localhost:3000/api/vehicle-images/proxy/Jeep/Wrangler/2008');

    if (response.ok) {
      pass('Frontend proxy returns HTTP 200');
    } else {
      fail('Frontend proxy returns HTTP 200', `HTTP ${response.status}`);
      return;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('image')) {
      pass(`Frontend proxy returns image (${contentType})`);
    } else {
      fail('Frontend proxy returns image', `Got: ${contentType}`);
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 100000) {
      pass(`Frontend proxy returns full image (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      fail('Frontend proxy returns full image', `Only ${buffer.byteLength} bytes`);
    }

  } catch (error) {
    fail('Frontend proxy', String(error));
  }
}

async function testAllVehicles() {
  log('\n--- Testing All Three Database Vehicles ---');

  const vehicles = [
    { id: 'f5428602-efc0-4776-847f-ab70f24db366', make: 'Toyota', model: 'Tundra', year: 2006 },
    { id: 'b5636cee-dfa5-4ad0-860d-2cc3fc5dfae0', make: 'Jeep', model: 'Wrangler', year: 2008 },
    { id: '57ca327d-aea5-46bf-85e7-f7fc97eee504', make: 'Subaru', model: 'Outback', year: 2016 },
  ];

  for (const v of vehicles) {
    try {
      const response = await fetch(`http://localhost:3000/api/vehicle-images/proxy/vehicle/${v.id}`);

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > 100000) {
          pass(`${v.year} ${v.make} ${v.model} - ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
        } else {
          fail(`${v.year} ${v.make} ${v.model}`, `Image too small: ${buffer.byteLength} bytes`);
        }
      } else {
        fail(`${v.year} ${v.make} ${v.model}`, `HTTP ${response.status}`);
      }
    } catch (error) {
      fail(`${v.year} ${v.make} ${v.model}`, String(error));
    }
  }
}

async function testImageInfoEndpoint() {
  log('\n--- Testing Image Info JSON Endpoint ---');

  try {
    const response = await fetch('http://localhost:4000/api/vehicle-images/Toyota/Tundra/2006');
    const data = await response.json() as { success: boolean; hasLocalImage: boolean; proxyUrl: string };

    if (data.success) {
      pass('Info endpoint returns success: true');
    } else {
      fail('Info endpoint returns success', `Got: ${data.success}`);
    }

    if (data.hasLocalImage === true) {
      pass('Info endpoint confirms local image exists');
    } else {
      fail('Info endpoint confirms local image', `hasLocalImage: ${data.hasLocalImage}`);
    }

    if (data.proxyUrl) {
      pass(`Info endpoint provides proxyUrl: ${data.proxyUrl}`);
    } else {
      fail('Info endpoint provides proxyUrl', 'proxyUrl missing');
    }

  } catch (error) {
    fail('Image info endpoint', String(error));
  }
}

async function runTests() {
  log('='.repeat(60));
  log('Vehicle Image Service Tests');
  log('='.repeat(60));

  await testProxyEndpoint();
  await testProxyVehicleIdEndpoint();
  await testFrontendProxy();
  await testAllVehicles();
  await testImageInfoEndpoint();

  log('\n' + '='.repeat(60));
  log(`Results: ${GREEN}${passed} passed${RESET}, ${RED}${failed} failed${RESET}`);
  log('='.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
