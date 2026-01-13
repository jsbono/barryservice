import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { processVoiceTranscript, VoiceCommand } from '../services/voice-processor.js';

const router = Router();

// Validation schemas
const transcriptSchema = z.object({
  transcript: z.string().min(1, 'Transcript is required').max(10000),
  context: z.object({
    current_customer_id: z.string().uuid().optional(),
    current_vehicle_id: z.string().uuid().optional(),
    current_service_id: z.string().uuid().optional(),
  }).optional(),
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * POST /voice/process - Process a voice transcript and extract commands/data
 */
router.post('/process', asyncHandler(async (req: Request, res: Response) => {
  const { transcript, context } = transcriptSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  try {
    // Process the transcript using LLM
    const result = await processVoiceTranscript(transcript, context);

    // If we extracted structured data, we can optionally execute the commands
    if (result.commands && result.commands.length > 0) {
      const executedCommands = await executeVoiceCommands(
        result.commands,
        req.supabase,
        context
      );

      res.json({
        data: {
          interpretation: result.interpretation,
          commands: executedCommands,
          raw_extraction: result.extraction,
          suggestions: result.suggestions,
        },
      });
      return;
    }

    res.json({
      data: {
        interpretation: result.interpretation,
        commands: [],
        raw_extraction: result.extraction,
        suggestions: result.suggestions,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Voice processing error:', error);
    throw ApiError.internal('Failed to process voice transcript');
  }
}));

/**
 * POST /voice/transcribe - Placeholder for audio transcription
 * In a real implementation, this would accept audio and return text
 */
router.post('/transcribe', asyncHandler(async (req: Request, res: Response) => {
  // This is a placeholder - actual implementation would use Whisper or similar
  const { audio_url } = z.object({
    audio_url: z.string().url().optional(),
  }).parse(req.body);

  if (!audio_url) {
    throw ApiError.badRequest('Audio URL is required');
  }

  // In production, you would:
  // 1. Download the audio from the URL
  // 2. Send to OpenAI Whisper API for transcription
  // 3. Return the transcribed text

  res.json({
    data: {
      message: 'Audio transcription endpoint - implement with Whisper API',
      status: 'not_implemented',
    },
  });
}));

/**
 * Execute voice commands against the database
 */
async function executeVoiceCommands(
  commands: VoiceCommand[],
  supabase: NonNullable<Request['supabase']>,
  context?: { current_customer_id?: string; current_vehicle_id?: string }
): Promise<Array<{ command: VoiceCommand; result: unknown; success: boolean; error?: string }>> {
  const results = [];

  for (const command of commands) {
    try {
      let result: unknown;

      switch (command.type) {
        case 'create_customer': {
          const { data, error } = await supabase
            .from('customers')
            .insert(command.data)
            .select()
            .single();
          if (error) throw error;
          result = data;
          break;
        }

        case 'update_customer': {
          const customerId = command.data.id || context?.current_customer_id;
          if (!customerId) {
            throw new Error('Customer ID required');
          }
          const { id: _id, ...updateData } = command.data;
          const { data, error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', customerId)
            .select()
            .single();
          if (error) throw error;
          result = data;
          break;
        }

        case 'create_vehicle': {
          const vehicleData = {
            ...command.data,
            customer_id: command.data.customer_id || context?.current_customer_id,
          };
          if (!vehicleData.customer_id) {
            throw new Error('Customer ID required for vehicle');
          }
          const { data, error } = await supabase
            .from('vehicles')
            .insert(vehicleData)
            .select()
            .single();
          if (error) throw error;
          result = data;
          break;
        }

        case 'update_vehicle': {
          const vehicleId = command.data.id || context?.current_vehicle_id;
          if (!vehicleId) {
            throw new Error('Vehicle ID required');
          }
          const { id: _id, ...updateData } = command.data;
          const { data, error } = await supabase
            .from('vehicles')
            .update(updateData)
            .eq('id', vehicleId)
            .select()
            .single();
          if (error) throw error;
          result = data;
          break;
        }

        case 'create_service': {
          const serviceData = {
            ...command.data,
            vehicle_id: command.data.vehicle_id || context?.current_vehicle_id,
          };
          if (!serviceData.vehicle_id) {
            throw new Error('Vehicle ID required for service');
          }
          const { data, error } = await supabase
            .from('service_records')
            .insert(serviceData)
            .select()
            .single();
          if (error) throw error;
          result = data;
          break;
        }

        case 'search_customer': {
          const { data, error } = await supabase
            .from('customers')
            .select('*')
            .or(`first_name.ilike.%${command.data.query}%,last_name.ilike.%${command.data.query}%,phone.ilike.%${command.data.query}%`)
            .limit(10);
          if (error) throw error;
          result = data;
          break;
        }

        case 'search_vehicle': {
          const { data, error } = await supabase
            .from('vehicles')
            .select('*, customer:customers(first_name, last_name)')
            .or(`license_plate.ilike.%${command.data.query}%,vin.ilike.%${command.data.query}%,make.ilike.%${command.data.query}%,model.ilike.%${command.data.query}%`)
            .limit(10);
          if (error) throw error;
          result = data;
          break;
        }

        case 'update_mileage': {
          const vehicleId = command.data.vehicle_id || context?.current_vehicle_id;
          if (!vehicleId) {
            throw new Error('Vehicle ID required');
          }
          const { data, error } = await supabase
            .from('vehicles')
            .update({ mileage: command.data.mileage })
            .eq('id', vehicleId)
            .select()
            .single();
          if (error) throw error;
          result = data;
          break;
        }

        case 'schedule_service': {
          const serviceData = {
            vehicle_id: command.data.vehicle_id || context?.current_vehicle_id,
            service_type: command.data.service_type,
            service_date: command.data.date,
            status: 'scheduled',
            notes: command.data.notes,
          };
          if (!serviceData.vehicle_id) {
            throw new Error('Vehicle ID required');
          }
          const { data, error } = await supabase
            .from('service_records')
            .insert(serviceData)
            .select()
            .single();
          if (error) throw error;
          result = data;
          break;
        }

        case 'add_note': {
          // Determine which entity to add note to
          if (context?.current_service_id) {
            const { data, error } = await supabase
              .from('service_records')
              .update({ notes: command.data.note })
              .eq('id', context.current_service_id)
              .select()
              .single();
            if (error) throw error;
            result = data;
          } else if (context?.current_vehicle_id) {
            const { data, error } = await supabase
              .from('vehicles')
              .update({ notes: command.data.note })
              .eq('id', context.current_vehicle_id)
              .select()
              .single();
            if (error) throw error;
            result = data;
          } else if (context?.current_customer_id) {
            const { data, error } = await supabase
              .from('customers')
              .update({ notes: command.data.note })
              .eq('id', context.current_customer_id)
              .select()
              .single();
            if (error) throw error;
            result = data;
          } else {
            throw new Error('No context provided for note');
          }
          break;
        }

        default:
          result = { message: `Unknown command type: ${command.type}` };
      }

      results.push({
        command,
        result,
        success: true,
      });
    } catch (error) {
      results.push({
        command,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * GET /voice/commands - Get available voice command types
 */
router.get('/commands', (_req: Request, res: Response) => {
  res.json({
    data: {
      commands: [
        {
          type: 'create_customer',
          description: 'Create a new customer',
          example: 'Add new customer John Smith, phone 555-1234',
        },
        {
          type: 'update_customer',
          description: 'Update existing customer info',
          example: 'Update customer email to john@example.com',
        },
        {
          type: 'create_vehicle',
          description: 'Add a new vehicle',
          example: 'Add 2020 Toyota Camry, license plate ABC123',
        },
        {
          type: 'update_vehicle',
          description: 'Update vehicle information',
          example: 'Update mileage to 45000',
        },
        {
          type: 'create_service',
          description: 'Log a service record',
          example: 'Log oil change, 2 hours labor at $75 per hour',
        },
        {
          type: 'search_customer',
          description: 'Find a customer',
          example: 'Find customer Smith',
        },
        {
          type: 'search_vehicle',
          description: 'Find a vehicle',
          example: 'Find vehicle with plate ABC123',
        },
        {
          type: 'schedule_service',
          description: 'Schedule a future service',
          example: 'Schedule brake inspection for next Tuesday',
        },
        {
          type: 'add_note',
          description: 'Add a note to current record',
          example: 'Note: customer prefers synthetic oil',
        },
      ],
    },
  });
});

export default router;
