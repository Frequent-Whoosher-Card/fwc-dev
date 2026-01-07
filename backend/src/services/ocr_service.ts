/**
 * OCR Service Manager
 * Mengelola Python daemon process yang tetap hidup untuk caching OCR model
 * Menggunakan file-based communication untuk kompatibilitas dengan Bun
 */

import { spawn } from "bun";
import { join } from "path";
import { writeFile, readFile, unlink, mkdir, access, constants, rename } from "fs/promises";
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
  private pythonProcess: any = null; // Bun.Subprocess
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  private requestDir: string;
  private responseDir: string;

  private constructor() {
    // Create temp directories for request/response communication
    this.requestDir = join(tmpdir(), "ocr_requests");
    this.responseDir = join(tmpdir(), "ocr_responses");
    console.log(`[OCR] Request dir: ${this.requestDir}`);
    console.log(`[OCR] Response dir: ${this.responseDir}`);
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
        
        // Check if venv Python exists, fallback to system python3
        let pythonExecutable = venvPython;
        try {
          await access(venvPython, constants.F_OK);
        } catch {
          // Fallback to system python3 if venv doesn't exist
          pythonExecutable = "python3";
          console.warn("OCR venv not found, using system python3. Consider running: cd scripts/ocr && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt");
        }

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
        const stderr = this.pythonProcess.stderr;
        if (stderr) {
          (async () => {
            try {
              for await (const chunk of stderr) {
                const decoded = new TextDecoder().decode(chunk);
                stderrChunks.push(decoded);
                // Log stderr in real-time for debugging (only if not suppressed)
                if (process.env.SUPPRESS_OCR_LOGS !== '1') {
                  process.stderr.write(decoded);
                }
              }
            } catch (e) {
              // Ignore stderr reading errors
            }
          })();
        }
        
        // Also collect stdout for debugging
        let stdoutChunks: string[] = [];
        const stdout = this.pythonProcess.stdout;
        if (stdout) {
          (async () => {
            try {
              for await (const chunk of stdout) {
                const decoded = new TextDecoder().decode(chunk);
                stdoutChunks.push(decoded);
                // Log stdout in real-time for debugging (only if not suppressed)
                if (process.env.SUPPRESS_OCR_LOGS !== '1') {
                  console.log(`[OCR Daemon] ${decoded.trim()}`);
                }
              }
            } catch (e) {
              // Ignore stdout reading errors
            }
          })();
        }

        // Monitor process exit
        this.pythonProcess.exited.then((code: number | null) => {
          console.error(`OCR daemon process exited with code ${code}`);
          if (stderrChunks.length > 0) {
            console.error("OCR daemon stderr:", stderrChunks.join('').slice(-500));
          }
          this.pythonProcess = null;
        }).catch((error: unknown) => {
          console.error("OCR daemon process error:", error);
          this.pythonProcess = null;
        });

        // Wait longer for model to load (OCR model can take 10-30 seconds on first load)
        console.log("Waiting for OCR daemon to initialize (this may take 10-30 seconds on first load)...");
        const initTimeout = 60000; // 60 seconds for initial model load
        const initStartTime = Date.now();
        
        while (Date.now() - initStartTime < initTimeout) {
          if (!this.pythonProcess || this.pythonProcess.killed) {
            const errorMsg = stderrChunks.length > 0
              ? `OCR daemon process crashed during initialization. Last error: ${stderrChunks.join('').slice(-1000)}`
              : "OCR daemon process failed to start or crashed during initialization";
            throw new Error(errorMsg);
          }
          
          // Check if daemon is ready by looking for "ready" signal or checking if it's processing
          // For now, just wait a bit and check process status
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          // If process is still running after 5 seconds, assume it's ready
          if (Date.now() - initStartTime > 5000) {
            break;
          }
        }

        // Final check
        if (!this.pythonProcess || this.pythonProcess.killed) {
          const errorMsg = stderrChunks.length > 0
            ? `OCR daemon process crashed during initialization. Last error: ${stderrChunks.join('').slice(-1000)}`
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
      // Write request to file atomically (write to temp file first, then rename)
      const tempRequestFile = `${requestFile}.tmp`;
      const request: OCRRequest = { image: imageBase64 };
      const requestJson = JSON.stringify(request);
      
      // Write to temp file first
      await writeFile(tempRequestFile, requestJson, 'utf8');
      
      // Rename atomically to ensure file is complete when Python reads it
      await rename(tempRequestFile, requestFile);
      
      console.log(`[OCR] Request file written: ${requestFile} (${requestJson.length} bytes)`);
      
      // Give Python daemon a moment to detect the file
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Wait for response file (polling with timeout)
      // OCR processing can take 5-15 seconds depending on image size and complexity
      const timeout = 60000; // 60 seconds (increased from 30)
      const startTime = Date.now();
      let response: OCRResponse | null = null;
      let lastError: Error | null = null;

      console.log(`[OCR] Waiting for response (timeout: ${timeout}ms)...`);

      while (Date.now() - startTime < timeout) {
        try {
          const responseData = await readFile(responseFile, "utf-8");
          response = JSON.parse(responseData);
          console.log(`[OCR] Response received after ${Date.now() - startTime}ms`);
          break;
        } catch (e) {
          lastError = e instanceof Error ? e : new Error(String(e));
          // File not ready yet, wait a bit
          await new Promise((resolve) => setTimeout(resolve, 200)); // Increased from 100ms to 200ms
          
          // Log progress every 5 seconds
          const elapsed = Date.now() - startTime;
          if (elapsed % 5000 < 200) {
            console.log(`[OCR] Still waiting for response... (${Math.round(elapsed / 1000)}s elapsed)`);
          }
        }
      }

      if (!response) {
        // Check if daemon is still running
        if (!this.pythonProcess || this.pythonProcess.killed) {
          throw new Error("OCR daemon process is not running. It may have crashed.");
        }
        throw new Error(`OCR request timeout after ${timeout}ms. Daemon may be overloaded or processing failed.`);
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

