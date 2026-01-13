import OpenAI from 'openai';
import { config } from '../config/index.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Voice command types that can be extracted from transcripts
 */
export type VoiceCommandType =
  | 'create_customer'
  | 'update_customer'
  | 'create_vehicle'
  | 'update_vehicle'
  | 'create_service'
  | 'search_customer'
  | 'search_vehicle'
  | 'update_mileage'
  | 'schedule_service'
  | 'add_note';

export interface VoiceCommand {
  type: VoiceCommandType;
  confidence: number;
  data: Record<string, unknown>;
}

export interface VoiceProcessingResult {
  interpretation: string;
  commands: VoiceCommand[];
  extraction: ExtractedData;
  suggestions: string[];
}

interface ExtractedData {
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  vehicle?: {
    make?: string;
    model?: string;
    year?: number;
    license_plate?: string;
    vin?: string;
    mileage?: number;
    color?: string;
  };
  service?: {
    service_type?: string;
    description?: string;
    labor_hours?: number;
    labor_rate?: number;
    parts_used?: string[];
    scheduled_date?: string;
    notes?: string;
  };
  intent?: string;
  entities?: Record<string, string>;
}

/**
 * System prompt for the voice processing LLM
 */
const SYSTEM_PROMPT = `You are an AI assistant for an automotive service shop management system. Your job is to parse voice transcripts from mechanics and service advisors and extract structured data.

When given a voice transcript, you should:
1. Identify the user's intent (creating records, updating info, searching, etc.)
2. Extract any customer, vehicle, or service information mentioned
3. Generate actionable commands that can be executed against the database
4. Provide suggestions if the transcript is ambiguous or incomplete

Common scenarios you'll encounter:
- Adding new customers with contact info
- Registering vehicles (make, model, year, license plate, VIN)
- Logging service records (oil changes, brake jobs, etc.)
- Updating vehicle mileage
- Scheduling future services
- Searching for customers or vehicles
- Adding notes to records

Output your response as JSON with the following structure:
{
  "interpretation": "A human-readable summary of what you understood",
  "commands": [
    {
      "type": "command_type",
      "confidence": 0.0-1.0,
      "data": { extracted fields }
    }
  ],
  "extraction": {
    "customer": { extracted customer fields },
    "vehicle": { extracted vehicle fields },
    "service": { extracted service fields },
    "intent": "primary intent",
    "entities": { any other extracted entities }
  },
  "suggestions": ["suggestions if ambiguous or incomplete"]
}

Command types:
- create_customer: Create a new customer record
- update_customer: Update existing customer (requires id or context)
- create_vehicle: Add a new vehicle
- update_vehicle: Update vehicle info
- create_service: Log a completed service
- search_customer: Find a customer by name/phone
- search_vehicle: Find a vehicle by plate/VIN
- update_mileage: Update vehicle mileage
- schedule_service: Schedule a future service appointment
- add_note: Add a note to a record

Be precise about numbers, dates, and proper nouns. If you're unsure about a value, set confidence lower and add a suggestion.`;

/**
 * Process a voice transcript and extract structured data using LLM
 */
export async function processVoiceTranscript(
  transcript: string,
  context?: {
    current_customer_id?: string;
    current_vehicle_id?: string;
    current_service_id?: string;
  }
): Promise<VoiceProcessingResult> {
  const contextInfo = context
    ? `\n\nCurrent context:\n- Customer ID: ${context.current_customer_id || 'none'}\n- Vehicle ID: ${context.current_vehicle_id || 'none'}\n- Service ID: ${context.current_service_id || 'none'}`
    : '';

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the smaller, faster model for voice processing
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Process this voice transcript:${contextInfo}\n\nTranscript: "${transcript}"`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent parsing
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      return {
        interpretation: 'Could not process the transcript',
        commands: [],
        extraction: {},
        suggestions: ['Please try speaking more clearly or provide more details'],
      };
    }

    // Parse the JSON response
    const result = JSON.parse(responseText) as VoiceProcessingResult;

    // Validate and sanitize the result
    return {
      interpretation: result.interpretation || 'Processed transcript',
      commands: validateCommands(result.commands || []),
      extraction: result.extraction || {},
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    console.error('Voice processing error:', error);

    // Fallback to basic parsing if LLM fails
    return fallbackParsing(transcript);
  }
}

/**
 * Validate and sanitize extracted commands
 */
function validateCommands(commands: VoiceCommand[]): VoiceCommand[] {
  const validTypes: VoiceCommandType[] = [
    'create_customer',
    'update_customer',
    'create_vehicle',
    'update_vehicle',
    'create_service',
    'search_customer',
    'search_vehicle',
    'update_mileage',
    'schedule_service',
    'add_note',
  ];

  return commands
    .filter(cmd => validTypes.includes(cmd.type))
    .map(cmd => ({
      type: cmd.type,
      confidence: Math.min(1, Math.max(0, cmd.confidence || 0.5)),
      data: cmd.data || {},
    }));
}

/**
 * Fallback parsing when LLM is unavailable
 */
function fallbackParsing(transcript: string): VoiceProcessingResult {
  const lowerTranscript = transcript.toLowerCase();
  const commands: VoiceCommand[] = [];
  const extraction: ExtractedData = {};

  // Basic keyword matching
  if (lowerTranscript.includes('new customer') || lowerTranscript.includes('add customer')) {
    commands.push({
      type: 'create_customer',
      confidence: 0.5,
      data: extractBasicCustomerInfo(transcript),
    });
    extraction.intent = 'create_customer';
  } else if (lowerTranscript.includes('new vehicle') || lowerTranscript.includes('add vehicle') || lowerTranscript.includes('add car')) {
    commands.push({
      type: 'create_vehicle',
      confidence: 0.5,
      data: extractBasicVehicleInfo(transcript),
    });
    extraction.intent = 'create_vehicle';
  } else if (lowerTranscript.includes('oil change') || lowerTranscript.includes('brake') || lowerTranscript.includes('service')) {
    commands.push({
      type: 'create_service',
      confidence: 0.5,
      data: extractBasicServiceInfo(transcript),
    });
    extraction.intent = 'create_service';
  } else if (lowerTranscript.includes('find') || lowerTranscript.includes('search') || lowerTranscript.includes('look up')) {
    if (lowerTranscript.includes('customer') || lowerTranscript.includes('name')) {
      commands.push({
        type: 'search_customer',
        confidence: 0.5,
        data: { query: extractSearchQuery(transcript) },
      });
    } else if (lowerTranscript.includes('vehicle') || lowerTranscript.includes('car') || lowerTranscript.includes('plate')) {
      commands.push({
        type: 'search_vehicle',
        confidence: 0.5,
        data: { query: extractSearchQuery(transcript) },
      });
    }
    extraction.intent = 'search';
  } else if (lowerTranscript.includes('mileage')) {
    const mileageMatch = transcript.match(/(\d{1,3}(,\d{3})*|\d+)/);
    if (mileageMatch) {
      commands.push({
        type: 'update_mileage',
        confidence: 0.5,
        data: { mileage: parseInt(mileageMatch[0].replace(/,/g, ''), 10) },
      });
    }
    extraction.intent = 'update_mileage';
  } else if (lowerTranscript.includes('schedule') || lowerTranscript.includes('appointment')) {
    commands.push({
      type: 'schedule_service',
      confidence: 0.5,
      data: extractScheduleInfo(transcript),
    });
    extraction.intent = 'schedule_service';
  } else if (lowerTranscript.includes('note') || lowerTranscript.includes('notes')) {
    commands.push({
      type: 'add_note',
      confidence: 0.5,
      data: { note: transcript },
    });
    extraction.intent = 'add_note';
  }

  return {
    interpretation: `Fallback parsing: detected intent "${extraction.intent || 'unknown'}"`,
    commands,
    extraction,
    suggestions: [
      'LLM processing was unavailable, using basic parsing',
      'Consider rephrasing for better accuracy',
    ],
  };
}

/**
 * Extract basic customer info from transcript
 */
function extractBasicCustomerInfo(transcript: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // Try to extract phone number
  const phoneMatch = transcript.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    data.phone = phoneMatch[0].replace(/[-.\s]/g, '');
  }

  // Try to extract email
  const emailMatch = transcript.match(/[\w.-]+@[\w.-]+\.\w+/i);
  if (emailMatch) {
    data.email = emailMatch[0].toLowerCase();
  }

  // Extract potential names (capitalized words after "customer" or "name")
  const nameMatch = transcript.match(/(?:customer|name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (nameMatch) {
    const names = nameMatch[1].split(/\s+/);
    data.first_name = names[0];
    if (names[1]) {
      data.last_name = names[1];
    }
  }

  return data;
}

/**
 * Extract basic vehicle info from transcript
 */
function extractBasicVehicleInfo(transcript: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // Extract year (4 digits that look like a year)
  const yearMatch = transcript.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    data.year = parseInt(yearMatch[0], 10);
  }

  // Common makes
  const makes = ['toyota', 'honda', 'ford', 'chevrolet', 'chevy', 'nissan', 'bmw', 'mercedes', 'audi', 'volkswagen', 'hyundai', 'kia', 'subaru', 'mazda', 'lexus', 'acura', 'infiniti', 'jeep', 'dodge', 'ram', 'gmc', 'buick', 'cadillac', 'chrysler'];
  const lowerTranscript = transcript.toLowerCase();
  for (const make of makes) {
    if (lowerTranscript.includes(make)) {
      data.make = make === 'chevy' ? 'Chevrolet' : make.charAt(0).toUpperCase() + make.slice(1);
      break;
    }
  }

  // Extract license plate pattern
  const plateMatch = transcript.match(/[A-Z0-9]{2,3}[-\s]?[A-Z0-9]{3,4}/i);
  if (plateMatch) {
    data.license_plate = plateMatch[0].toUpperCase().replace(/[-\s]/g, '');
  }

  // Extract mileage
  const mileageMatch = transcript.match(/(\d{1,3}(,\d{3})*|\d+)\s*(?:miles|mi|mileage)/i);
  if (mileageMatch) {
    data.mileage = parseInt(mileageMatch[1].replace(/,/g, ''), 10);
  }

  return data;
}

/**
 * Extract basic service info from transcript
 */
function extractBasicServiceInfo(transcript: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const lowerTranscript = transcript.toLowerCase();

  // Common service types
  const serviceTypes = [
    { pattern: /oil\s*change/i, type: 'Oil Change' },
    { pattern: /brake/i, type: 'Brake Service' },
    { pattern: /tire\s*rotation/i, type: 'Tire Rotation' },
    { pattern: /alignment/i, type: 'Wheel Alignment' },
    { pattern: /transmission/i, type: 'Transmission Service' },
    { pattern: /tune[-\s]?up/i, type: 'Tune Up' },
    { pattern: /inspection/i, type: 'Inspection' },
    { pattern: /diagnostic/i, type: 'Diagnostic' },
    { pattern: /battery/i, type: 'Battery Service' },
    { pattern: /coolant|radiator/i, type: 'Cooling System Service' },
  ];

  for (const { pattern, type } of serviceTypes) {
    if (pattern.test(lowerTranscript)) {
      data.service_type = type;
      break;
    }
  }

  // Extract hours
  const hoursMatch = transcript.match(/(\d+(?:\.\d+)?)\s*hours?/i);
  if (hoursMatch) {
    data.labor_hours = parseFloat(hoursMatch[1]);
  }

  // Extract rate
  const rateMatch = transcript.match(/\$?(\d+(?:\.\d{2})?)\s*(?:per\s*hour|\/\s*hr|hourly)/i);
  if (rateMatch) {
    data.labor_rate = parseFloat(rateMatch[1]);
  }

  return data;
}

/**
 * Extract search query from transcript
 */
function extractSearchQuery(transcript: string): string {
  // Remove common filler words
  const cleaned = transcript
    .replace(/(?:find|search|look\s*up|for|the|a|an)\s*/gi, '')
    .replace(/customer|vehicle|car|name|plate/gi, '')
    .trim();

  return cleaned;
}

/**
 * Extract scheduling info from transcript
 */
function extractScheduleInfo(transcript: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const lowerTranscript = transcript.toLowerCase();

  // Extract service type
  const serviceInfo = extractBasicServiceInfo(transcript);
  if (serviceInfo.service_type) {
    data.service_type = serviceInfo.service_type;
  }

  // Try to extract relative dates
  const today = new Date();
  if (lowerTranscript.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    data.date = tomorrow.toISOString().split('T')[0];
  } else if (lowerTranscript.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    data.date = nextWeek.toISOString().split('T')[0];
  } else if (lowerTranscript.includes('monday')) {
    data.date = getNextDayOfWeek(1);
  } else if (lowerTranscript.includes('tuesday')) {
    data.date = getNextDayOfWeek(2);
  } else if (lowerTranscript.includes('wednesday')) {
    data.date = getNextDayOfWeek(3);
  } else if (lowerTranscript.includes('thursday')) {
    data.date = getNextDayOfWeek(4);
  } else if (lowerTranscript.includes('friday')) {
    data.date = getNextDayOfWeek(5);
  }

  return data;
}

/**
 * Get the next occurrence of a day of week (0 = Sunday, 1 = Monday, etc.)
 */
function getNextDayOfWeek(dayOfWeek: number): string {
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntilTarget = dayOfWeek - currentDay;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntilTarget);
  return targetDate.toISOString().split('T')[0];
}
