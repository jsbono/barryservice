import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { VoiceProcessor, ParsedVoiceData, getVoiceProcessor } from '../services/voiceProcessor.js';
import * as VehicleModel from '../models/Vehicle.js';

const router = Router();

// Configure multer for audio file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (Whisper API limit)
  },
  fileFilter: (req, file, cb) => {
    const validMimeTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a',
      'audio/wav', 'audio/wave', 'audio/x-wav',
      'audio/webm', 'audio/ogg', 'audio/flac'
    ];
    if (validMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(mp3|mp4|m4a|wav|webm|ogg|flac)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio format. Supported: mp3, mp4, m4a, wav, webm, ogg, flac'));
    }
  }
});

// Apply authentication middleware to all voice routes
router.use(authMiddleware);

/**
 * POST /api/voice/parse
 * Parse a voice transcript and extract structured service data
 *
 * Request body:
 * {
 *   transcript: string,  // The voice transcript text
 *   vehicleId?: string   // Optional vehicle ID for context
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data: ParsedVoiceData,
 *   vehicle?: Vehicle
 * }
 */
router.post('/parse', async (req: Request, res: Response): Promise<void> => {
  try {
    const { transcript, vehicleId } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({
        success: false,
        error: 'transcript is required and must be a string'
      });
      return;
    }

    if (transcript.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'transcript cannot be empty'
      });
      return;
    }

    // Get vehicle info if provided
    let vehicle = null;
    if (vehicleId) {
      vehicle = VehicleModel.findById(vehicleId);
      if (!vehicle) {
        res.status(400).json({
          success: false,
          error: 'Vehicle not found'
        });
        return;
      }
    }

    // Parse the transcript
    const voiceProcessor = getVoiceProcessor();
    const parsedData = await voiceProcessor.parseTranscript(transcript);

    res.json({
      success: true,
      data: parsedData,
      vehicle: vehicle || undefined
    });
  } catch (error) {
    console.error('Voice parse error:', error);

    // Check for OpenAI API key error
    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      res.status(503).json({
        success: false,
        error: 'Voice processing service not configured'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse transcript'
    });
  }
});

/**
 * POST /api/voice/transcribe
 * Transcribe an audio file to text using Whisper API
 *
 * Request: multipart/form-data with 'audio' file field
 *
 * Supported formats: mp3, mp4, m4a, wav, webm, ogg, flac
 * Max file size: 25MB (OpenAI Whisper limit)
 *
 * Response:
 * {
 *   success: boolean,
 *   transcript: string
 * }
 */
router.post('/transcribe', upload.single('audio'), async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if file was uploaded
    // Note: Requires multer or similar middleware to handle file uploads
    // The file will be available as req.file if using multer
    const file = (req as any).file;

    if (!file) {
      // Check for raw body with audio data
      if (!req.body || !Buffer.isBuffer(req.body)) {
        res.status(400).json({
          success: false,
          error: 'Audio file is required. Use multipart/form-data with "audio" field or send raw audio data.'
        });
        return;
      }
    }

    const audioBuffer = file ? file.buffer : req.body;
    const filename = file?.originalname || 'audio.mp3';

    // Validate file size (25MB limit for Whisper)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioBuffer.length > maxSize) {
      res.status(400).json({
        success: false,
        error: 'Audio file too large. Maximum size is 25MB.'
      });
      return;
    }

    // Validate file type
    const validExtensions = ['mp3', 'mp4', 'm4a', 'wav', 'webm', 'ogg', 'flac'];
    const ext = filename.toLowerCase().split('.').pop() || '';
    if (!validExtensions.includes(ext)) {
      res.status(400).json({
        success: false,
        error: `Unsupported audio format. Supported formats: ${validExtensions.join(', ')}`
      });
      return;
    }

    // Transcribe the audio
    const voiceProcessor = getVoiceProcessor();
    const transcript = await voiceProcessor.transcribeAudio(audioBuffer, filename);

    res.json({
      success: true,
      transcript
    });
  } catch (error) {
    console.error('Voice transcribe error:', error);

    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      res.status(503).json({
        success: false,
        error: 'Voice processing service not configured'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to transcribe audio'
    });
  }
});

/**
 * POST /api/voice/process
 * Combined endpoint: transcribe audio file and parse the resulting transcript
 *
 * Request: multipart/form-data with:
 *   - 'audio' file field (required)
 *   - 'vehicleId' field (optional)
 *
 * Response:
 * {
 *   success: boolean,
 *   data: ParsedVoiceData & { transcript: string },
 *   vehicle?: Vehicle
 * }
 */
router.post('/process', upload.single('audio'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = (req as any).file;

    if (!file) {
      if (!req.body || !Buffer.isBuffer(req.body)) {
        res.status(400).json({
          success: false,
          error: 'Audio file is required. Use multipart/form-data with "audio" field or send raw audio data.'
        });
        return;
      }
    }

    const audioBuffer = file ? file.buffer : req.body;
    const filename = file?.originalname || 'audio.mp3';
    const vehicleId = (req as any).body?.vehicleId || req.query.vehicleId;

    // Validate file size
    const maxSize = 25 * 1024 * 1024;
    if (audioBuffer.length > maxSize) {
      res.status(400).json({
        success: false,
        error: 'Audio file too large. Maximum size is 25MB.'
      });
      return;
    }

    // Validate file type
    const validExtensions = ['mp3', 'mp4', 'm4a', 'wav', 'webm', 'ogg', 'flac'];
    const ext = filename.toLowerCase().split('.').pop() || '';
    if (!validExtensions.includes(ext)) {
      res.status(400).json({
        success: false,
        error: `Unsupported audio format. Supported formats: ${validExtensions.join(', ')}`
      });
      return;
    }

    // Get vehicle info if provided
    let vehicle = null;
    if (vehicleId) {
      vehicle = VehicleModel.findById(vehicleId);
      if (!vehicle) {
        res.status(400).json({
          success: false,
          error: 'Vehicle not found'
        });
        return;
      }
    }

    // Process the audio (transcribe + parse)
    const voiceProcessor = getVoiceProcessor();
    const result = await voiceProcessor.processAudio(audioBuffer, filename);

    res.json({
      success: true,
      data: result,
      vehicle: vehicle || undefined
    });
  } catch (error) {
    console.error('Voice process error:', error);

    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      res.status(503).json({
        success: false,
        error: 'Voice processing service not configured'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process audio'
    });
  }
});

/**
 * GET /api/voice/service-codes
 * Get available service code mappings for reference
 *
 * Response:
 * {
 *   success: boolean,
 *   serviceCodes: Array<{ code: string, name: string, keywords: string[] }>
 * }
 */
router.get('/service-codes', (req: Request, res: Response): void => {
  // Import service code mappings
  const { SERVICE_CODE_MAPPINGS } = require('../services/voiceProcessor.js');

  const serviceCodes = Object.entries(SERVICE_CODE_MAPPINGS).map(([code, mapping]: [string, any]) => ({
    code,
    name: mapping.name,
    keywords: mapping.keywords
  }));

  res.json({
    success: true,
    serviceCodes
  });
});

export default router;
