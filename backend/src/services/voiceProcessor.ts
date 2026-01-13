import OpenAI, { toFile } from 'openai';
import { Readable } from 'stream';

// Service code mappings for automotive services
const SERVICE_CODE_MAPPINGS: Record<string, { name: string; code: string; keywords: string[] }> = {
  OIL_CHANGE: {
    name: 'Oil Change',
    code: 'OIL_CHANGE',
    keywords: ['oil change', 'oil', 'lube', 'oil filter']
  },
  BRAKE_PADS_FRONT: {
    name: 'Brake Pad Replacement - Front',
    code: 'BRAKE_PADS_FRONT',
    keywords: ['front brake', 'front pad', 'front brake pad']
  },
  BRAKE_PADS_REAR: {
    name: 'Brake Pad Replacement - Rear',
    code: 'BRAKE_PADS_REAR',
    keywords: ['rear brake', 'rear pad', 'rear brake pad']
  },
  BRAKE_PADS_ALL: {
    name: 'Brake Pad Replacement - All',
    code: 'BRAKE_PADS_ALL',
    keywords: ['all brake', 'brake pads', 'brakes']
  },
  BRAKE_ROTORS_FRONT: {
    name: 'Brake Rotor Replacement - Front',
    code: 'BRAKE_ROTORS_FRONT',
    keywords: ['front rotor', 'front disc']
  },
  BRAKE_ROTORS_REAR: {
    name: 'Brake Rotor Replacement - Rear',
    code: 'BRAKE_ROTORS_REAR',
    keywords: ['rear rotor', 'rear disc']
  },
  TIRE_ROTATION: {
    name: 'Tire Rotation',
    code: 'TIRE_ROTATION',
    keywords: ['tire rotation', 'rotate tire', 'rotated tire']
  },
  TIRE_REPLACEMENT: {
    name: 'Tire Replacement',
    code: 'TIRE_REPLACEMENT',
    keywords: ['new tire', 'tire replacement', 'replaced tire', 'tire install']
  },
  AIR_FILTER: {
    name: 'Air Filter Replacement',
    code: 'AIR_FILTER',
    keywords: ['air filter', 'engine filter']
  },
  CABIN_FILTER: {
    name: 'Cabin Air Filter Replacement',
    code: 'CABIN_FILTER',
    keywords: ['cabin filter', 'cabin air']
  },
  SPARK_PLUGS: {
    name: 'Spark Plug Replacement',
    code: 'SPARK_PLUGS',
    keywords: ['spark plug', 'plugs', 'ignition']
  },
  BATTERY: {
    name: 'Battery Replacement',
    code: 'BATTERY',
    keywords: ['battery', 'new battery']
  },
  COOLANT_FLUSH: {
    name: 'Coolant Flush',
    code: 'COOLANT_FLUSH',
    keywords: ['coolant', 'antifreeze', 'radiator flush', 'coolant flush']
  },
  TRANSMISSION_SERVICE: {
    name: 'Transmission Service',
    code: 'TRANSMISSION_SERVICE',
    keywords: ['transmission', 'trans fluid', 'transmission fluid', 'trans service']
  },
  ALIGNMENT: {
    name: 'Wheel Alignment',
    code: 'ALIGNMENT',
    keywords: ['alignment', 'wheel alignment', 'front end alignment']
  },
  TIMING_BELT: {
    name: 'Timing Belt Replacement',
    code: 'TIMING_BELT',
    keywords: ['timing belt', 'timing chain']
  },
  SERPENTINE_BELT: {
    name: 'Serpentine Belt Replacement',
    code: 'SERPENTINE_BELT',
    keywords: ['serpentine belt', 'drive belt', 'belt replacement']
  },
  FUEL_FILTER: {
    name: 'Fuel Filter Replacement',
    code: 'FUEL_FILTER',
    keywords: ['fuel filter', 'gas filter']
  },
  WIPER_BLADES: {
    name: 'Wiper Blade Replacement',
    code: 'WIPER_BLADES',
    keywords: ['wiper', 'wiper blade', 'windshield wiper']
  },
  INSPECTION: {
    name: 'Vehicle Inspection',
    code: 'INSPECTION',
    keywords: ['inspection', 'safety inspection', 'state inspection']
  },
  DIAGNOSTIC: {
    name: 'Diagnostic Service',
    code: 'DIAGNOSTIC',
    keywords: ['diagnostic', 'check engine', 'code read', 'scan']
  },
  AC_SERVICE: {
    name: 'A/C Service',
    code: 'AC_SERVICE',
    keywords: ['ac', 'a/c', 'air conditioning', 'ac recharge', 'freon']
  },
  POWER_STEERING: {
    name: 'Power Steering Service',
    code: 'POWER_STEERING',
    keywords: ['power steering', 'steering fluid']
  },
  DIFFERENTIAL: {
    name: 'Differential Service',
    code: 'DIFFERENTIAL',
    keywords: ['differential', 'diff fluid', 'rear end']
  }
};

// Types for parsed voice data
export interface ParsedService {
  name: string;
  code: string;
}

export interface ParsedPart {
  name: string;
  quantity: number;
  matchedSku: string | null;
}

export interface ParsedVoiceData {
  services: ParsedService[];
  laborHours: number | null;
  parts: ParsedPart[];
  notes: string | null;
  raw: {
    extractedText: string;
    confidence: number;
  };
}

export interface VoiceProcessorConfig {
  apiKey?: string;
  model?: string;
}

// GPT-4 response structure for parsing
interface GPTParseResponse {
  services: Array<{
    description: string;
    suggestedCode?: string;
  }>;
  laborHours: number | null;
  parts: Array<{
    name: string;
    quantity: number;
    brand?: string;
  }>;
  notes: string | null;
}

/**
 * Voice Processor Service
 * Handles voice transcript parsing using OpenAI GPT-4 and audio transcription using Whisper
 */
export class VoiceProcessor {
  private client: OpenAI;
  private model: string;

  constructor(config: VoiceProcessorConfig = {}) {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    this.client = new OpenAI({ apiKey });
    this.model = config.model || 'gpt-4-turbo-preview';
  }

  /**
   * Parse a voice transcript and extract structured service data
   */
  async parseTranscript(transcript: string): Promise<ParsedVoiceData> {
    const systemPrompt = `You are an expert automotive service technician assistant. Your job is to parse voice transcripts from mechanics and extract structured service information.

Extract the following from the transcript:
1. Services performed (e.g., oil change, brake pad replacement, tire rotation)
2. Labor hours mentioned (total hours worked)
3. Parts used (with quantities if mentioned, default to 1)
4. Any additional notes or observations

For services, try to match them to these common service types:
- OIL_CHANGE: Oil changes, lube services
- BRAKE_PADS_FRONT/REAR/ALL: Brake pad replacements
- BRAKE_ROTORS_FRONT/REAR: Rotor replacements
- TIRE_ROTATION: Tire rotations
- TIRE_REPLACEMENT: New tire installations
- AIR_FILTER: Engine air filter
- CABIN_FILTER: Cabin air filter
- SPARK_PLUGS: Spark plug replacement
- BATTERY: Battery replacement
- COOLANT_FLUSH: Coolant/antifreeze service
- TRANSMISSION_SERVICE: Transmission fluid service
- ALIGNMENT: Wheel alignment
- TIMING_BELT/SERPENTINE_BELT: Belt replacements
- FUEL_FILTER: Fuel filter
- WIPER_BLADES: Wiper blade replacement
- INSPECTION: Vehicle inspections
- DIAGNOSTIC: Diagnostic services
- AC_SERVICE: A/C services
- POWER_STEERING: Power steering service
- DIFFERENTIAL: Differential service

For parts, include the brand name if mentioned (e.g., "Mobil 1 filter", "Bosch brake pads").

Respond in valid JSON format with this structure:
{
  "services": [{"description": "...", "suggestedCode": "..."}],
  "laborHours": number or null,
  "parts": [{"name": "...", "quantity": number, "brand": "..."}],
  "notes": "..." or null
}`;

    const userPrompt = `Parse this mechanic's voice transcript and extract the service information:

"${transcript}"

Remember to respond in valid JSON format only.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response content from GPT-4');
      }

      const parsed: GPTParseResponse = JSON.parse(content);

      // Map services to service codes
      const services = this.mapServicesToServiceCodes(parsed.services);

      // Format parts
      const parts: ParsedPart[] = parsed.parts.map((part) => ({
        name: part.brand ? `${part.brand} ${part.name}` : part.name,
        quantity: part.quantity || 1,
        matchedSku: null // SKU matching would require inventory lookup
      }));

      return {
        services,
        laborHours: parsed.laborHours,
        parts,
        notes: parsed.notes,
        raw: {
          extractedText: content,
          confidence: 0.95 // GPT-4 generally has high confidence
        }
      };
    } catch (error) {
      console.error('Voice transcript parsing error:', error);
      throw new Error(`Failed to parse voice transcript: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Transcribe audio file to text using OpenAI Whisper
   */
  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
    try {
      // Convert buffer to a file object using OpenAI's toFile utility
      const file = await toFile(audioBuffer, filename, {
        type: this.getMimeType(filename)
      });

      const response = await this.client.audio.transcriptions.create({
        model: 'whisper-1',
        file: file,
        language: 'en',
        prompt: 'Customer names and automotive service work. Common services: oil change, brake pads, tire rotation, transmission service.'
      });

      return response.text;
    } catch (error) {
      console.error('Audio transcription error:', error);
      throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process audio file end-to-end: transcribe and parse
   */
  async processAudio(audioBuffer: Buffer, filename: string): Promise<ParsedVoiceData & { transcript: string }> {
    // Step 1: Transcribe audio to text
    const transcript = await this.transcribeAudio(audioBuffer, filename);

    // Step 2: Parse the transcript
    const parsedData = await this.parseTranscript(transcript);

    return {
      ...parsedData,
      transcript
    };
  }

  /**
   * Map extracted service descriptions to service codes
   */
  private mapServicesToServiceCodes(
    services: Array<{ description: string; suggestedCode?: string }>
  ): ParsedService[] {
    return services.map((service) => {
      // First, try the suggested code from GPT-4
      if (service.suggestedCode && SERVICE_CODE_MAPPINGS[service.suggestedCode]) {
        return {
          name: SERVICE_CODE_MAPPINGS[service.suggestedCode].name,
          code: service.suggestedCode
        };
      }

      // Otherwise, try to match by keywords
      const descLower = service.description.toLowerCase();

      for (const [code, mapping] of Object.entries(SERVICE_CODE_MAPPINGS)) {
        for (const keyword of mapping.keywords) {
          if (descLower.includes(keyword)) {
            return {
              name: mapping.name,
              code
            };
          }
        }
      }

      // If no match, return a custom service
      return {
        name: service.description,
        code: 'CUSTOM'
      };
    });
  }

  /**
   * Get MIME type from filename
   */
  private getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      mp3: 'audio/mpeg',
      mp4: 'audio/mp4',
      m4a: 'audio/m4a',
      wav: 'audio/wav',
      webm: 'audio/webm',
      ogg: 'audio/ogg',
      flac: 'audio/flac'
    };
    return mimeTypes[ext || ''] || 'audio/mpeg';
  }
}

// Singleton instance for convenience
let voiceProcessorInstance: VoiceProcessor | null = null;

export function getVoiceProcessor(config?: VoiceProcessorConfig): VoiceProcessor {
  if (!voiceProcessorInstance) {
    voiceProcessorInstance = new VoiceProcessor(config);
  }
  return voiceProcessorInstance;
}

// Export service code mappings for reference
export { SERVICE_CODE_MAPPINGS };
