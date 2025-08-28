/**
 * Advanced Device Fingerprinting Utility
 * Implements 50+ browser characteristics for unique device identification
 * Privacy-compliant with GDPR consent handling
 */

import { DeviceFingerprint } from "@/types/chat";
import { FingerprintingOptions } from "@/types/fingerprint";

const DEFAULT_OPTIONS: FingerprintingOptions = {
  enableCanvas: true,
  enableWebGL: true,
  enableAudio: true,
  enableFonts: true,
  enableBattery: true,
  enableWebRTC: true,
  enablePlugins: true,
  enableMediaDevices: true,
  timeout: 5000,
  respectPrivacy: true,
};

// Common fonts for detection
const COMMON_FONTS = [
  // Windows fonts
  "Arial",
  "Arial Black",
  "Bahnschrift",
  "Calibri",
  "Cambria",
  "Cambria Math",
  "Candara",
  "Comic Sans MS",
  "Consolas",
  "Constantia",
  "Corbel",
  "Courier New",
  "Ebrima",
  "Franklin Gothic Medium",
  "Gabriola",
  "Gadugi",
  "Georgia",
  "HoloLens MDL2 Assets",
  "Impact",
  "Ink Free",
  "Javanese Text",
  "Leelawadee UI",
  "Lucida Console",
  "Lucida Sans Unicode",
  "Malgun Gothic",
  "Marlett",
  "Microsoft Himalaya",
  "Microsoft JhengHei",
  "Microsoft New Tai Lue",
  "Microsoft PhagsPa",
  "Microsoft Sans Serif",
  "Microsoft Tai Le",
  "Microsoft YaHei",
  "Microsoft Yi Baiti",
  "MingLiU-ExtB",
  "Mongolian Baiti",
  "MS Gothic",
  "MV Boli",
  "Myanmar Text",
  "Nirmala UI",
  "Palatino Linotype",
  "Segoe MDL2 Assets",
  "Segoe Print",
  "Segoe Script",
  "Segoe UI",
  "Segoe UI Historic",
  "Segoe UI Emoji",
  "Segoe UI Symbol",
  "SimSun",
  "Sitka",
  "Sylfaen",
  "Symbol",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
  "Webdings",
  "Wingdings",
  "Yu Gothic",

  // macOS fonts
  "American Typewriter",
  "Andale Mono",
  "Arial",
  "Arial Black",
  "Arial Narrow",
  "Arial Rounded MT Bold",
  "Arial Unicode MS",
  "Avenir",
  "Avenir Next",
  "Avenir Next Condensed",
  "Baskerville",
  "Big Caslon",
  "Bodoni 72",
  "Bodoni 72 Oldstyle",
  "Bodoni 72 Smallcaps",
  "Bradley Hand",
  "Brush Script MT",
  "Chalkboard",
  "Chalkboard SE",
  "Chalkduster",
  "Charter",
  "Cochin",
  "Comic Sans MS",
  "Copperplate",
  "Courier",
  "Courier New",
  "Didot",
  "DIN Alternate",
  "DIN Condensed",
  "Futura",
  "Geneva",
  "Georgia",
  "Gill Sans",
  "Helvetica",
  "Helvetica Neue",
  "Herculanum",
  "Hoefler Text",
  "Impact",
  "Lucida Grande",
  "Luminari",
  "Marker Felt",
  "Menlo",
  "Microsoft Sans Serif",
  "Monaco",
  "Noteworthy",
  "Optima",
  "Palatino",
  "Papyrus",
  "Phosphate",
  "Rockwell",
  "Savoye LET",
  "SignPainter",
  "Skia",
  "Snell Roundhand",
  "Tahoma",
  "Times",
  "Times New Roman",
  "Trattatello",
  "Trebuchet MS",
  "Verdana",
  "Zapfino",

  // Linux fonts
  "Abyssinica SIL",
  "DejaVu Sans",
  "DejaVu Sans Condensed",
  "DejaVu Sans Mono",
  "DejaVu Serif",
  "Droid Sans",
  "Droid Sans Mono",
  "Droid Serif",
  "FreeMono",
  "FreeSans",
  "FreeSerif",
  "Liberation Mono",
  "Liberation Sans",
  "Liberation Sans Narrow",
  "Liberation Serif",
  "Linux Biolinum G",
  "Linux Libertine G",
  "Lohit Gujarati",
  "Lohit Hindi",
  "Lohit Punjabi",
  "Lohit Tamil",
  "Lohit Telugu",
  "Meera",
  "Noto Sans",
  "Noto Serif",
  "Open Sans",
  "Oxygen",
  "Padauk",
  "Source Code Pro",
  "Source Sans Pro",
  "Source Serif Pro",
  "Ubuntu",
  "Ubuntu Condensed",
  "Ubuntu Mono",

  // Generic fonts
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
];

class DeviceFingerprintingError extends Error {
  constructor(message: string, public readonly context: string) {
    super(message);
    this.name = "DeviceFingerprintingError";
  }
}

export class DeviceFingerprinter {
  private options: FingerprintingOptions;
  private errors: string[] = [];

  constructor(options: Partial<FingerprintingOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  private handleError(error: any, context: string): void {
    const errorMessage = `${context}: ${error?.message || "Unknown error"}`;
    this.errors.push(errorMessage);
    console.warn("Fingerprinting error:", errorMessage);
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T | null> {
    try {
      return await Promise.race([
        promise,
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), timeoutMs)
        ),
      ]);
    } catch (error) {
      return null;
    }
  }

  // Utility method to safely execute fingerprinting functions
  private safeExecute<T>(fn: () => T, context: string): T | undefined {
    try {
      return fn();
    } catch (error) {
      this.handleError(error, context);
      return undefined;
    }
  }

  // Utility method to safely execute async fingerprinting functions
  private async safeExecuteAsync<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      this.handleError(error, context);
      return undefined;
    }
  }

  // Canvas fingerprinting
  private generateCanvasFingerprint(): DeviceFingerprint["canvas"] {
    return this.safeExecute(() => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return undefined;

      canvas.width = 200;
      canvas.height = 50;

      // Text rendering signature
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Hello, world! 🌍", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("Hello, world! 🌍", 4, 17);

      // Geometry rendering signature
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgb(255,0,255)";
      ctx.beginPath();
      ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgb(0,255,255)";
      ctx.beginPath();
      ctx.arc(100, 50, 50, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgb(255,255,0)";
      ctx.beginPath();
      ctx.arc(75, 100, 50, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();

      const textSignature = canvas.toDataURL();

      // Create geometry signature
      const geometryCanvas = document.createElement("canvas");
      const geometryCtx = geometryCanvas.getContext("2d");
      if (geometryCtx) {
        geometryCanvas.width = 100;
        geometryCanvas.height = 100;
        geometryCtx.fillStyle = "#ff0000";
        geometryCtx.fillRect(0, 0, 100, 100);
        geometryCtx.fillStyle = "#00ff00";
        geometryCtx.fillRect(25, 25, 50, 50);
      }

      return {
        signature: textSignature,
        textSignature: textSignature.substring(0, 100),
        geometrySignature: geometryCanvas.toDataURL().substring(0, 100),
      };
    }, "canvas_fingerprinting");
  }

  // WebGL fingerprinting
  private generateWebGLFingerprint(): DeviceFingerprint["webgl"] {
    return this.safeExecute(() => {
      const canvas = document.createElement("canvas");
      const gl = (canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")) as WebGLRenderingContext;
      if (!gl) return undefined;

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : "Unknown";
      const vendor = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : "Unknown";

      const extensions = gl.getSupportedExtensions() || [];

      const parameters: Record<string, any> = {};
      const parameterNames = [
        "VERSION",
        "SHADING_LANGUAGE_VERSION",
        "VENDOR",
        "RENDERER",
        "MAX_VERTEX_ATTRIBS",
        "MAX_VERTEX_UNIFORM_VECTORS",
        "MAX_VERTEX_TEXTURE_IMAGE_UNITS",
        "MAX_VARYING_VECTORS",
        "MAX_FRAGMENT_UNIFORM_VECTORS",
        "MAX_TEXTURE_IMAGE_UNITS",
        "MAX_TEXTURE_SIZE",
        "MAX_CUBE_MAP_TEXTURE_SIZE",
        "MAX_RENDERBUFFER_SIZE",
        "MAX_VIEWPORT_DIMS",
        "ALIASED_LINE_WIDTH_RANGE",
        "ALIASED_POINT_SIZE_RANGE",
      ];

      parameterNames.forEach((name) => {
        try {
          const param = (gl as any)[name];
          if (param !== undefined) {
            parameters[name] = gl.getParameter(param);
          }
        } catch (e) {
          // Ignore parameter errors
        }
      });

      // Generate WebGL signature
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const vertices = new Float32Array([
        -0.2, -0.9, 0, 0.4, -0.26, 0, 0, 0.732134444, 0,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

      if (vertexShader && fragmentShader) {
        gl.shaderSource(
          vertexShader,
          "attribute vec2 attrVertex;varying vec2 varyinTexCoordinate;uniform vec2 uniformOffset;void main(){varyinTexCoordinate=attrVertex+uniformOffset;gl_Position=vec4(attrVertex,0,1);}"
        );
        gl.compileShader(vertexShader);

        gl.shaderSource(
          fragmentShader,
          "precision mediump float;varying vec2 varyinTexCoordinate;void main() {gl_FragColor=vec4(varyinTexCoordinate,0,1);}"
        );
        gl.compileShader(fragmentShader);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
      const signature = canvas.toDataURL();

      return {
        renderer,
        vendor,
        version: parameters.VERSION || "Unknown",
        shadingLanguageVersion:
          parameters.SHADING_LANGUAGE_VERSION || "Unknown",
        extensions,
        parameters,
        signature: signature.substring(0, 100),
      };
    }, "webgl_fingerprinting");
  }

  // Audio context fingerprinting
  private async generateAudioFingerprint(): Promise<
    DeviceFingerprint["audio"]
  > {
    return this.safeExecuteAsync(async () => {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return undefined;

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gainNode = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      gainNode.gain.setValueAtTime(0, context.currentTime);
      oscillator.frequency.setValueAtTime(10000, context.currentTime);
      oscillator.type = "triangle";

      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(0);

      return new Promise((resolve) => {
        let samples: number[] = [];

        scriptProcessor.onaudioprocess = (event) => {
          const buffer = event.inputBuffer.getChannelData(0);
          samples = Array.from(buffer.slice(0, 100));

          oscillator.stop();
          if (context) {
            context.close();
          }

          const signature = samples.reduce(
            (acc, val) => acc + val.toString(),
            ""
          );

          resolve({
            signature: btoa(signature).substring(0, 50),
            sampleRate: context.sampleRate,
            maxChannelCount: context.destination.maxChannelCount,
            numberOfInputs: context.destination.numberOfInputs,
            numberOfOutputs: context.destination.numberOfOutputs,
            channelCount: context.destination.channelCount,
            channelCountMode: context.destination.channelCountMode,
            channelInterpretation: context.destination.channelInterpretation,
          });
        };

        // Timeout fallback
        setTimeout(() => {
          try {
            oscillator.stop();
            if (context) {
              context.close();
            }
          } catch (e) {}

          resolve({
            signature: "timeout",
            sampleRate: context.sampleRate,
            maxChannelCount: context.destination.maxChannelCount,
            numberOfInputs: context.destination.numberOfInputs,
            numberOfOutputs: context.destination.numberOfOutputs,
            channelCount: context.destination.channelCount,
            channelCountMode: context.destination.channelCountMode,
            channelInterpretation: context.destination.channelInterpretation,
          });
        }, 1000);
      });
    }, "audio_fingerprinting");
  }

  // Font detection
  private generateFontFingerprint(): DeviceFingerprint["fonts"] {
    return this.safeExecute(() => {
      const baseFonts = ["monospace", "sans-serif", "serif"];
      const testString = "mmmmmmmmmmlli";
      const testSize = "72px";
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) return undefined;

      canvas.width = 60;
      canvas.height = 60;

      const baseFontWidths: Record<string, number> = {};

      // Measure base fonts
      baseFonts.forEach((baseFont) => {
        context.font = `${testSize} ${baseFont}`;
        baseFontWidths[baseFont] = context.measureText(testString).width;
      });

      const availableFonts: string[] = [];

      // Test each font
      COMMON_FONTS.forEach((font) => {
        baseFonts.forEach((baseFont) => {
          context.font = `${testSize} ${font}, ${baseFont}`;
          const width = context.measureText(testString).width;

          if (width !== baseFontWidths[baseFont]) {
            if (!availableFonts.includes(font)) {
              availableFonts.push(font);
            }
          }
        });
      });

      const signature = availableFonts.sort().join(",");

      return {
        available: availableFonts,
        signature: btoa(signature).substring(0, 50),
        count: availableFonts.length,
      };
    }, "font_detection");
  }

  // Screen characteristics
  private generateScreenFingerprint(): DeviceFingerprint["screen"] {
    return this.safeExecute(() => {
      const screen = window.screen;

      return {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        pixelRatio: window.devicePixelRatio || 1,
        orientation: screen.orientation?.type || "unknown",
        touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      };
    }, "screen_detection");
  }

  // Hardware detection
  private generateHardwareFingerprint(): DeviceFingerprint["hardware"] {
    return this.safeExecute(() => {
      return {
        concurrency: navigator.hardwareConcurrency || 0,
        memory: (navigator as any).deviceMemory || 0,
        platform: navigator.platform,
        architecture: (navigator as any).cpuClass || "unknown",
        maxTouchPoints: navigator.maxTouchPoints || 0,
      };
    }, "hardware_detection");
  }

  // Battery API
  private async generateBatteryFingerprint(): Promise<
    DeviceFingerprint["battery"]
  > {
    return this.safeExecuteAsync(async () => {
      const battery = await (navigator as any).getBattery?.();
      if (!battery) return undefined;

      return {
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
        level: Math.round(battery.level * 100) / 100,
      };
    }, "battery_detection");
  }

  // WebRTC IP detection
  private async generateWebRTCFingerprint(): Promise<
    DeviceFingerprint["webrtc"]
  > {
    return this.safeExecuteAsync(async () => {
      const RTCPeerConnection =
        window.RTCPeerConnection ||
        (window as any).mozRTCPeerConnection ||
        (window as any).webkitRTCPeerConnection;

      if (!RTCPeerConnection) return undefined;

      return new Promise((resolve) => {
        const localIPs: string[] = [];
        const candidateTypes: string[] = [];
        let publicIP = "";

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        });

        pc.createDataChannel("");

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            const match = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);

            if (match) {
              const ip = match[1];
              if (
                ip.startsWith("192.168.") ||
                ip.startsWith("10.") ||
                ip.startsWith("172.")
              ) {
                if (!localIPs.includes(ip)) {
                  localIPs.push(ip);
                }
              } else {
                publicIP = ip;
              }
            }

            // Extract candidate type
            const typeMatch = candidate.match(/typ (\w+)/);
            if (typeMatch && !candidateTypes.includes(typeMatch[1])) {
              candidateTypes.push(typeMatch[1]);
            }
          } else {
            pc.close();
            resolve({
              localIPs,
              publicIP,
              candidateTypes,
            });
          }
        };

        pc.createOffer().then((offer) => pc.setLocalDescription(offer));

        // Timeout fallback
        setTimeout(() => {
          pc.close();
          resolve({
            localIPs,
            publicIP,
            candidateTypes,
          });
        }, 3000);
      });
    }, "webrtc_detection");
  }

  // Plugin detection
  private generatePluginFingerprint(): DeviceFingerprint["plugins"] {
    return this.safeExecute(() => {
      const plugins = Array.from(navigator.plugins).map((plugin) => ({
        name: plugin.name,
        filename: plugin.filename,
        description: plugin.description,
        version: (plugin as any).version || "unknown",
      }));

      const signature = plugins
        .map((p) => `${p.name}:${p.version}`)
        .sort()
        .join(",");

      return {
        list: plugins,
        count: plugins.length,
        signature: btoa(signature).substring(0, 50),
      };
    }, "plugin_detection");
  }

  // Media devices detection
  private async generateMediaDevicesFingerprint(): Promise<
    DeviceFingerprint["mediaDevices"]
  > {
    return this.safeExecuteAsync(async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return undefined;

      const devices = await navigator.mediaDevices.enumerateDevices();

      const audioInputs = devices.filter((d) => d.kind === "audioinput").length;
      const audioOutputs = devices.filter(
        (d) => d.kind === "audiooutput"
      ).length;
      const videoInputs = devices.filter((d) => d.kind === "videoinput").length;

      const deviceList = devices.map((device) => ({
        kind: device.kind,
        label: device.label || "unknown",
        deviceId: device.deviceId ? "present" : "absent",
      }));

      return {
        audioInputs,
        audioOutputs,
        videoInputs,
        devices: deviceList,
      };
    }, "media_devices_detection");
  }

  // Miscellaneous characteristics
  private generateMiscFingerprint(): DeviceFingerprint["misc"] {
    return this.safeExecute(() => {
      const storageQuota = this.getStorageQuota();

      return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        languages: Array.from(navigator.languages || [navigator.language]),
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack || "unknown",
        storageQuota,
        indexedDBSupport: !!window.indexedDB,
        webSQLSupport: !!(window as any).openDatabase,
        localStorageSupport: !!window.localStorage,
        sessionStorageSupport: !!window.sessionStorage,
      };
    }, "misc_detection");
  }

  private getStorageQuota(): number {
    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        navigator.storage.estimate().then((estimate) => {
          return estimate.quota || 0;
        });
      }
      return 0;
    } catch {
      return 0;
    }
  }

  // Generate complete fingerprint
  public async generateFingerprint(): Promise<DeviceFingerprint> {
    const startTime = Date.now();
    this.errors = [];

    const fingerprint: Partial<DeviceFingerprint> = {};

    // Collect all fingerprinting data efficiently
    const fingerprintingTasks: Promise<void>[] = [];

    // Synchronous fingerprinting tasks
    if (this.options.enableCanvas) {
      fingerprintingTasks.push(
        Promise.resolve().then(() => {
          fingerprint.canvas = this.generateCanvasFingerprint();
        })
      );
    }

    if (this.options.enableWebGL) {
      fingerprintingTasks.push(
        Promise.resolve().then(() => {
          fingerprint.webgl = this.generateWebGLFingerprint();
        })
      );
    }

    if (this.options.enableFonts) {
      fingerprintingTasks.push(
        Promise.resolve().then(() => {
          fingerprint.fonts = this.generateFontFingerprint();
        })
      );
    }

    if (this.options.enablePlugins) {
      fingerprintingTasks.push(
        Promise.resolve().then(() => {
          fingerprint.plugins = this.generatePluginFingerprint();
        })
      );
    }

    // Always collect basic characteristics
    fingerprintingTasks.push(
      Promise.resolve().then(() => {
        fingerprint.screen = this.generateScreenFingerprint();
        fingerprint.hardware = this.generateHardwareFingerprint();
        fingerprint.misc = this.generateMiscFingerprint();
      })
    );

    // Asynchronous fingerprinting tasks
    if (this.options.enableAudio) {
      fingerprintingTasks.push(
        this.generateAudioFingerprint().then((audio) => {
          fingerprint.audio = audio;
        })
      );
    }

    if (this.options.enableBattery) {
      fingerprintingTasks.push(
        this.generateBatteryFingerprint().then((battery) => {
          fingerprint.battery = battery;
        })
      );
    }

    if (this.options.enableWebRTC) {
      fingerprintingTasks.push(
        this.generateWebRTCFingerprint().then((webrtc) => {
          fingerprint.webrtc = webrtc;
        })
      );
    }

    if (this.options.enableMediaDevices) {
      fingerprintingTasks.push(
        this.generateMediaDevicesFingerprint().then((mediaDevices) => {
          fingerprint.mediaDevices = mediaDevices;
        })
      );
    }

    // Wait for all fingerprinting to complete with timeout
    await this.withTimeout(
      Promise.allSettled(fingerprintingTasks),
      this.options.timeout || 5000
    );

    // Generate overall signature
    const signatureData = JSON.stringify({
      canvas: fingerprint.canvas?.signature,
      webgl: fingerprint.webgl?.signature,
      audio: fingerprint.audio?.signature,
      fonts: fingerprint.fonts?.signature,
      screen: fingerprint.screen,
      hardware: fingerprint.hardware,
      plugins: fingerprint.plugins?.signature,
      misc: fingerprint.misc,
    });

    const signature = btoa(signatureData).substring(0, 64);

    // Calculate confidence score
    const enabledFeatures = Object.values(this.options).filter(Boolean).length;
    const successfulFeatures = Object.keys(fingerprint).length;
    const confidence = Math.round((successfulFeatures / enabledFeatures) * 100);

    return {
      ...fingerprint,
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        signature,
        confidence,
        errors: this.errors,
      },
    } as DeviceFingerprint;
  }

  // Static method for quick fingerprinting
  public static async generateQuickFingerprint(
    options?: Partial<FingerprintingOptions>
  ): Promise<DeviceFingerprint> {
    const fingerprinter = new DeviceFingerprinter(options);
    return fingerprinter.generateFingerprint();
  }
}

// Privacy-compliant fingerprinting function
export async function generateDeviceFingerprint(
  consentGiven = false,
  options?: Partial<FingerprintingOptions>
): Promise<DeviceFingerprint | null> {
  try {
    if (!consentGiven && options?.respectPrivacy !== false) {
      console.warn("Device fingerprinting requires user consent");
      return null;
    }

    const fingerprinter = new DeviceFingerprinter(options);
    return await fingerprinter.generateFingerprint();
  } catch (error) {
    console.error("Failed to generate device fingerprint:", error);
    return null;
  }
}

// Utility function to compare fingerprints
export function compareFingerprints(
  fp1: DeviceFingerprint,
  fp2: DeviceFingerprint
): number {
  const weights = {
    canvas: 0.2,
    webgl: 0.2,
    audio: 0.15,
    fonts: 0.15,
    screen: 0.1,
    hardware: 0.1,
    plugins: 0.05,
    misc: 0.05,
  };

  let totalWeight = 0;
  let matchingWeight = 0;

  Object.entries(weights).forEach(([key, weight]) => {
    const val1 = (fp1 as any)[key];
    const val2 = (fp2 as any)[key];

    if (val1 && val2) {
      totalWeight += weight;

      if (
        key === "canvas" ||
        key === "webgl" ||
        key === "audio" ||
        key === "fonts" ||
        key === "plugins"
      ) {
        if (val1.signature === val2.signature) {
          matchingWeight += weight;
        }
      } else {
        const similarity =
          JSON.stringify(val1) === JSON.stringify(val2) ? 1 : 0;
        matchingWeight += weight * similarity;
      }
    }
  });

  return totalWeight > 0 ? (matchingWeight / totalWeight) * 100 : 0;
}
