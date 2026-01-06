/**
 * OCR Service Manager
 * Mengelola Python daemon process yang tetap hidup untuk caching OCR model
 * Menggunakan file-based communication untuk kompatibilitas dengan Bun
 */

import { spawn } from "bun";
import { join } from "path";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { tmpdir } from "os";
import { randomUUID } from "node:crypto";

interface OCRRequest {
  image: string; // base64 encoded image
}

interface OCRResponse {
  success: boolean;
  data?: {
    identityNumber: string | null;
    name: string | null;
    gender: string | null;
    alamat: string | null;
  };
  raw?: {
    text_blocks_count: number;
    combined_text: string;
  };
  error?: string;
}

class OCRService {
  private static instance: OCRService | null = null;
  private pythonProcess: ReturnType<typeof spawn> | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  private requestDir: string;
  private responseDir: string;

  private constructor() {
    // Create temp directories for request/response communication
    this.requestDir = join(tmpdir(), "ocr_requests");
    this.responseDir = join(tmpdir(), "ocr_responses");
  }

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Initialize Python daemon process (load model once)
   */
  private async initialize(): Promise<void> {
    if (this.pythonProcess && !this.pythonProcess.killed) {
      return; // Already initialized
    }

    if (this.isInitializing && this.initPromise) {
      return this.initPromise; // Wait for ongoing initialization
    }

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        // Ensure directories exist before spawning Python daemon
        await mkdir(this.requestDir, { recursive: true });
        await mkdir(this.responseDir, { recursive: true });

        const pythonScriptPath = join(
          process.cwd(),
          "scripts/ocr/ocr_daemon.py"
        );

        // Use venv Python if available, otherwise fall back to system python3
        const venvPython = join(
          process.cwd(),
          "scripts/ocr/venv/bin/python3"
        );
        const pythonExecutable = venvPython;

        // Spawn Python daemon process
        this.pythonProcess = spawn([
          pythonExecutable,
          pythonScriptPath,
          this.requestDir,
          this.responseDir,
        ], {
          stdout: "pipe",
          stderr: "pipe",
          env: {
            ...process.env,
            DISABLE_MODEL_SOURCE_CHECK: "True",
            PYTHONUNBUFFERED: "1",
            SUPPRESS_OCR_LOGS: "1",
          },
        });

        // Collect stderr for debugging (non-blocking)
        let stderrChunks: string[] = [];
        if (this.pythonProcess.stderr) {
          (async () => {
            try {
              for await (const chunk of this.pythonProcess.stderr!) {
                stderrChunks.push(new TextDecoder().decode(chunk));
              }
            } catch (e) {
              // Ignore stderr reading errors
            }
          })();
        }

        // Monitor process exit
        this.pythonProcess.exited.then((code) => {
          console.error(`OCR daemon process exited with code ${code}`);
          if (stderrChunks.length > 0) {
            console.error("OCR daemon stderr:", stderrChunks.join('').slice(-500));
          }
          this.pythonProcess = null;
        }).catch((error) => {
          console.error("OCR daemon process error:", error);
          this.pythonProcess = null;
        });

        // Wait a bit for model to load
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check if process is still running
        if (!this.pythonProcess || this.pythonProcess.killed) {
          const errorMsg = stderrChunks.length > 0
            ? `OCR daemon process crashed during initialization. Last error: ${stderrChunks.join('').slice(-500)}`
            : "OCR daemon process failed to start or crashed during initialization";
          throw new Error(errorMsg);
        }

        console.log("OCR daemon initialized - model cached in memory");
      } catch (error) {
        console.error("Failed to initialize OCR daemon:", error);
        throw error;
      } finally {
        this.isInitializing = false;
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Process OCR request using cached daemon
   */
  async processImage(imageFile: File): Promise<OCRResponse> {
    // Ensure daemon is initialized
    await this.initialize();

    if (!this.pythonProcess || this.pythonProcess.killed) {
      throw new Error("OCR daemon is not running");
    }

    // Ensure directories exist (double check)
    await mkdir(this.requestDir, { recursive: true });
    await mkdir(this.responseDir, { recursive: true });

    // Convert image file to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageBase64 = buffer.toString("base64");

    // Create unique request ID
    const requestId = randomUUID();
    const requestFile = join(this.requestDir, `${requestId}.json`);
    const responseFile = join(this.responseDir, `${requestId}.json`);

    try {
      // Write request to file
      const request: OCRRequest = { image: imageBase64 };
      await writeFile(requestFile, JSON.stringify(request));

      // Wait for response file (polling with timeout)
      const timeout = 30000; // 30 seconds
      const startTime = Date.now();
      let response: OCRResponse | null = null;

      while (Date.now() - startTime < timeout) {
        try {
          const responseData = await readFile(responseFile, "utf-8");
          response = JSON.parse(responseData);
          break;
        } catch (e) {
          // File not ready yet, wait a bit
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (!response) {
        throw new Error("OCR request timeout");
      }

      // Cleanup files
      try {
        await unlink(requestFile);
        await unlink(responseFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      return response;
    } catch (error) {
      // Cleanup on error
      try {
        await unlink(requestFile).catch(() => {});
        await unlink(responseFile).catch(() => {});
      } catch (e) {
        // Ignore cleanup errors
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error("OCR extraction failed: Unknown error");
    }
  }

  /**
   * Restart daemon if it crashes
   */
  private async restartDaemon(): Promise<void> {
    console.log("Restarting OCR daemon...");
    if (this.pythonProcess) {
      try {
        this.pythonProcess.kill();
      } catch (e) {
        // Ignore kill errors
      }
    }
    this.pythonProcess = null;
    this.isInitializing = false;
    this.initPromise = null;

    // Reinitialize
    await this.initialize();
  }

  /**
   * Shutdown daemon gracefully
   */
  async shutdown(): Promise<void> {
    if (this.pythonProcess) {
      try {
        this.pythonProcess.kill();
        await this.pythonProcess.exited;
      } catch (e) {
        // Ignore errors
      }
      this.pythonProcess = null;
    }
  }
}

export const ocrService = OCRService.getInstance();

