import OpenAI from 'openai';
import { query, queryOne, execute } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Directory to store downloaded images
const IMAGE_DIR = path.join(process.cwd(), 'data', 'vehicle-images');

// Ensure image directory exists
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

interface VehicleImage {
  id: string;
  vehicle_key: string;
  image_path: string;
  created_at: string;
}

// Create table if not exists (updated schema for local storage)
function ensureTable() {
  execute(`
    CREATE TABLE IF NOT EXISTS vehicle_images_v2 (
      id TEXT PRIMARY KEY,
      vehicle_key TEXT UNIQUE NOT NULL,
      image_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  execute(`CREATE INDEX IF NOT EXISTS idx_vehicle_images_v2_key ON vehicle_images_v2(vehicle_key)`);
}

// Generate a unique key for a vehicle make/model/year combo
function getVehicleKey(make: string, model: string, year: number): string {
  return `${make.toLowerCase()}_${model.toLowerCase()}_${year}`.replace(/\\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// Check if we have a locally stored image
function getCachedImage(vehicleKey: string): VehicleImage | null {
  ensureTable();
  const record = queryOne<VehicleImage>(
    'SELECT * FROM vehicle_images_v2 WHERE vehicle_key = ?',
    [vehicleKey]
  );

  // Verify the file still exists
  if (record && fs.existsSync(record.image_path)) {
    return record;
  }

  // Clean up stale record if file doesn't exist
  if (record) {
    execute('DELETE FROM vehicle_images_v2 WHERE vehicle_key = ?', [vehicleKey]);
  }

  return null;
}

// Download image from URL and save locally
async function downloadAndSaveImage(url: string, vehicleKey: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const filename = `${vehicleKey}_${Date.now()}.png`;
  const filepath = path.join(IMAGE_DIR, filename);

  fs.writeFileSync(filepath, Buffer.from(buffer));

  return filepath;
}

// Save image path to database
function cacheImage(vehicleKey: string, imagePath: string): VehicleImage {
  ensureTable();
  const id = uuidv4();
  const now = new Date().toISOString();

  execute(
    'INSERT OR REPLACE INTO vehicle_images_v2 (id, vehicle_key, image_path, created_at) VALUES (?, ?, ?, ?)',
    [id, vehicleKey, imagePath, now]
  );

  return { id, vehicle_key: vehicleKey, image_path: imagePath, created_at: now };
}

// Generate vehicle image using DALL-E and save locally
export async function generateVehicleImage(
  make: string,
  model: string,
  year: number
): Promise<{ imagePath: string; cached: boolean }> {
  const vehicleKey = getVehicleKey(make, model, year);

  // Check cache first
  const cached = getCachedImage(vehicleKey);
  if (cached) {
    return { imagePath: cached.image_path, cached: true };
  }

  // Check if OpenAI API key is available
  const openai = getOpenAIClient();
  if (!openai) {
    // Return a placeholder - we'll handle this in the route
    return { imagePath: '', cached: false };
  }

  try {
    // Generate image with DALL-E
    const prompt = `Professional automotive photography of a ${year} ${make} ${model}, 3/4 front view angle, studio lighting, clean white background, high resolution, photorealistic, showroom quality, no text or watermarks`;

    console.log(`[VehicleImage] Generating image for ${year} ${make} ${model}...`);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'natural',
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E');
    }

    // Download and save the image locally
    console.log(`[VehicleImage] Downloading image...`);
    const imagePath = await downloadAndSaveImage(imageUrl, vehicleKey);

    // Cache the local path
    cacheImage(vehicleKey, imagePath);

    console.log(`[VehicleImage] Saved to ${imagePath}`);

    return { imagePath, cached: false };
  } catch (error) {
    console.error('Failed to generate vehicle image:', error);
    return { imagePath: '', cached: false };
  }
}

// Get or generate vehicle image (returns local file path)
export async function getVehicleImage(
  make: string,
  model: string,
  year: number
): Promise<string> {
  const result = await generateVehicleImage(make, model, year);
  return result.imagePath;
}

// Get image file path for serving
export function getImageFilePath(vehicleKey: string): string | null {
  const cached = getCachedImage(vehicleKey);
  return cached?.image_path || null;
}

// Get brand colors for placeholders
export function getVehicleColors(make: string): { bg: string; fg: string } {
  const brandColors: Record<string, { bg: string; fg: string }> = {
    toyota: { bg: 'eb0a1e', fg: 'ffffff' },
    honda: { bg: 'cc0000', fg: 'ffffff' },
    ford: { bg: '003478', fg: 'ffffff' },
    chevrolet: { bg: 'd4af37', fg: '000000' },
    bmw: { bg: '0066b1', fg: 'ffffff' },
    mercedes: { bg: '000000', fg: 'ffffff' },
    audi: { bg: 'bb0a30', fg: 'ffffff' },
    volkswagen: { bg: '001e50', fg: 'ffffff' },
    nissan: { bg: 'c3002f', fg: 'ffffff' },
    hyundai: { bg: '002c5f', fg: 'ffffff' },
    kia: { bg: '05141f', fg: 'ffffff' },
    subaru: { bg: '013c74', fg: 'ffffff' },
    mazda: { bg: '910a2d', fg: 'ffffff' },
    lexus: { bg: '1a1a1a', fg: 'ffffff' },
    acura: { bg: '000000', fg: 'ffffff' },
    infiniti: { bg: '1c1c1c', fg: 'ffffff' },
    tesla: { bg: 'cc0000', fg: 'ffffff' },
    jeep: { bg: '1d252d', fg: 'ffffff' },
    dodge: { bg: 'ba0c2f', fg: 'ffffff' },
    ram: { bg: '000000', fg: 'ffffff' },
    gmc: { bg: 'cc0033', fg: 'ffffff' },
    buick: { bg: '002f6c', fg: 'ffffff' },
    cadillac: { bg: '9d8461', fg: '000000' },
    lincoln: { bg: '324a5f', fg: 'ffffff' },
    volvo: { bg: '003057', fg: 'ffffff' },
    porsche: { bg: '000000', fg: 'ffffff' },
    jaguar: { bg: '000000', fg: 'b4975a' },
    'land rover': { bg: '005a2b', fg: 'ffffff' },
    mini: { bg: '000000', fg: 'ffffff' },
    fiat: { bg: '8b0000', fg: 'ffffff' },
    alfa: { bg: '8b0000', fg: 'ffffff' },
  };

  const lowerMake = make.toLowerCase();
  return brandColors[lowerMake] || { bg: '4a5568', fg: 'ffffff' };
}

// Get placeholder URL for when OpenAI is not available
export function getPlaceholderUrl(make: string, model: string): string {
  const colors = getVehicleColors(make);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(`${make} ${model}`)}&background=${colors.bg}&color=${colors.fg}&size=512&bold=true&format=png`;
}
