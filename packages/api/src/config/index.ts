import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),

  // Supabase configuration
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // OpenAI configuration for voice processing
  OPENAI_API_KEY: z.string().min(1),

  // CORS origins (comma-separated)
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),

  // Email configuration (optional, for notifications)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // VIN lookup API (optional)
  NHTSA_API_URL: z.string().url().default('https://vpic.nhtsa.dot.gov/api'),

  // Scheduler configuration
  SCHEDULER_INTERVAL_MS: z.string().default('3600000'), // 1 hour default

  // JWT configuration
  JWT_SECRET: z.string().min(32).optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

function loadConfig(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      console.error('Environment validation failed:');
      missingVars.forEach(v => console.error(`  - ${v}`));

      // In development, provide helpful defaults message
      if (process.env.NODE_ENV !== 'production') {
        console.error('\nPlease create a .env file with the required variables.');
        console.error('See .env.example for reference.');
      }

      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

// Parse environment on module load (will throw if invalid)
let envConfig: EnvConfig;

try {
  envConfig = loadConfig();
} catch {
  // Provide fallback config for development if env vars are missing
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Using fallback development configuration');
    envConfig = {
      NODE_ENV: 'development',
      PORT: '3001',
      SUPABASE_URL: process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'placeholder-openai-key',
      CORS_ORIGINS: 'http://localhost:3000,http://localhost:5173',
      NHTSA_API_URL: 'https://vpic.nhtsa.dot.gov/api',
      SCHEDULER_INTERVAL_MS: '3600000',
    };
  } else {
    throw new Error('Missing required environment variables in production');
  }
}

export const config = {
  nodeEnv: envConfig.NODE_ENV,
  port: parseInt(envConfig.PORT, 10),

  supabase: {
    url: envConfig.SUPABASE_URL,
    anonKey: envConfig.SUPABASE_ANON_KEY,
    serviceRoleKey: envConfig.SUPABASE_SERVICE_ROLE_KEY,
  },

  openai: {
    apiKey: envConfig.OPENAI_API_KEY,
  },

  corsOrigins: envConfig.CORS_ORIGINS.split(',').map(origin => origin.trim()),

  smtp: {
    host: envConfig.SMTP_HOST,
    port: envConfig.SMTP_PORT ? parseInt(envConfig.SMTP_PORT, 10) : undefined,
    user: envConfig.SMTP_USER,
    pass: envConfig.SMTP_PASS,
    from: envConfig.SMTP_FROM,
  },

  nhtsa: {
    apiUrl: envConfig.NHTSA_API_URL,
  },

  scheduler: {
    intervalMs: parseInt(envConfig.SCHEDULER_INTERVAL_MS, 10),
  },

  jwt: {
    secret: envConfig.JWT_SECRET,
  },
};

export type Config = typeof config;
