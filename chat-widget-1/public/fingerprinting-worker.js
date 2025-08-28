/**
 * Device Fingerprinting Web Worker
 * Handles intensive canvas, WebGL, and audio operations off the main thread
 */

// Common fonts for detection
const COMMON_FONTS = [
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
  "Apple Chancery",
  "Apple Color Emoji",
  "Apple SD Gothic Neo",
  "Apple Symbols",
  "AppleGothic",
  "AppleMyungjo",
  "Avenir",
  "Avenir Next",
  "Chalkboard",
  "Chalkboard SE",
  "Cochin",
  "Copperplate",
  "Courier",
  "Futura",
  "Geneva",
  "Gill Sans",
  "Helvetica",
  "Helvetica Neue",
  "Herculanum",
  "Lucida Grande",
  "Marker Felt",
  "Menlo",
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
  "Trattatello",
  "Zapfino",
  "Ubuntu",
  "Ubuntu Condensed",
  "Ubuntu Light",
  "Ubuntu Mono",
  "DejaVu Sans",
  "DejaVu Sans Mono",
  "DejaVu Serif",
  "Droid Sans",
  "Droid Sans Mono",
  "Droid Serif",
  "Liberation Sans",
  "Liberation Sans Narrow",
  "Liberation Serif",
]

class WorkerFingerprinter {
  constructor() {
    this.errors = []
  }

  handleError(error, context) {
    const errorMessage = `${context}: ${error?.message || "Unknown error"}`
    this.errors.push(errorMessage)
    console.warn("Worker fingerprinting error:", errorMessage)
  }

  safeExecute(fn, context) {
    try {
      return fn()
    } catch (error) {
      this.handleError(error, context)
      return undefined
    }
  }

  async safeExecuteAsync(fn, context) {
    try {
      return await fn()
    } catch (error) {
      this.handleError(error, context)
      return undefined
    }
  }

  // Canvas fingerprinting with progressive rendering
  generateCanvasFingerprint() {
    return this.safeExecute(() => {
      const canvas = new OffscreenCanvas(200, 50)
      const ctx = canvas.getContext("2d")
      if (!ctx) return undefined

      // Text rendering signature
      ctx.textBaseline = "top"
      ctx.font = "14px Arial"
      ctx.fillStyle = "#f60"
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = "#069"
      ctx.fillText("Hello, world! 🌍", 2, 15)
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)"
      ctx.fillText("Hello, world! 🌍", 4, 17)

      // Geometry rendering signature with yield points
      ctx.globalCompositeOperation = "multiply"
      ctx.fillStyle = "rgb(255,0,255)"
      ctx.beginPath()
      ctx.arc(50, 50, 50, 0, Math.PI * 2, true)
      ctx.closePath()
      ctx.fill()

      // Yield point for non-blocking
      setTimeout(() => {}, 0)

      ctx.fillStyle = "rgb(0,255,255)"
      ctx.beginPath()
      ctx.arc(100, 50, 50, 0, Math.PI * 2, true)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = "rgb(255,255,0)"
      ctx.beginPath()
      ctx.arc(75, 100, 50, 0, Math.PI * 2, true)
      ctx.closePath()
      ctx.fill()

      const textSignature = canvas.convertToBlob().then((blob) => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })
      })

      // Create geometry signature
      const geometryCanvas = new OffscreenCanvas(100, 100)
      const geometryCtx = geometryCanvas.getContext("2d")
      if (geometryCtx) {
        geometryCtx.fillStyle = "#ff0000"
        geometryCtx.fillRect(0, 0, 100, 100)
        geometryCtx.fillStyle = "#00ff00"
        geometryCtx.fillRect(25, 25, 50, 50)
      }

      return Promise.all([textSignature, geometryCanvas.convertToBlob()]).then(([textBlob, geometryBlob]) => {
        return {
          signature: textBlob,
          textSignature: textBlob.substring(0, 100),
          geometrySignature: geometryBlob.substring(0, 100),
        }
      })
    }, "canvas_fingerprinting")
  }

  // WebGL fingerprinting with progressive processing
  generateWebGLFingerprint() {
    return this.safeExecute(() => {
      const canvas = new OffscreenCanvas(256, 256)
      const gl = canvas.getContext("webgl") || canvas.getContext("webgl2")
      if (!gl) return undefined

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info")
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "Unknown"
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : "Unknown"

      const extensions = gl.getSupportedExtensions() || []

      const parameters = {}
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
      ]

      // Progressive parameter collection with yield points
      parameterNames.forEach((name, index) => {
        try {
          const param = gl[name]
          if (param !== undefined) {
            parameters[name] = gl.getParameter(param)
          }
          // Yield every 5 parameters
          if (index % 5 === 0) {
            setTimeout(() => {}, 0)
          }
        } catch (e) {
          // Ignore parameter errors
        }
      })

      // Generate WebGL signature with progressive rendering
      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      const vertices = new Float32Array([-0.2, -0.9, 0, 0.4, -0.26, 0, 0, 0.732134444, 0])
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

      const vertexShader = gl.createShader(gl.VERTEX_SHADER)
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

      if (vertexShader && fragmentShader) {
        gl.shaderSource(
          vertexShader,
          "attribute vec2 attrVertex;varying vec2 varyinTexCoordinate;uniform vec2 uniformOffset;void main(){varyinTexCoordinate=attrVertex+uniformOffset;gl_Position=vec4(attrVertex,0,1);}",
        )
        gl.compileShader(vertexShader)

        gl.shaderSource(
          fragmentShader,
          "precision mediump float;varying vec2 varyinTexCoordinate;void main() {gl_FragColor=vec4(varyinTexCoordinate,0,1);}",
        )
        gl.compileShader(fragmentShader)

        const program = gl.createProgram()
        if (program) {
          gl.attachShader(program, vertexShader)
          gl.attachShader(program, fragmentShader)
          gl.linkProgram(program)
          // WebGL API call - not a React hook
          gl.useProgram(program)
        }
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3)

      return canvas.convertToBlob().then((blob) => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              renderer,
              vendor,
              version: parameters.VERSION || "Unknown",
              shadingLanguageVersion: parameters.SHADING_LANGUAGE_VERSION || "Unknown",
              extensions,
              parameters,
              signature: reader.result.substring(0, 100),
            })
          }
          reader.readAsDataURL(blob)
        })
      })
    }, "webgl_fingerprinting")
  }

  // Font detection with progressive processing
  generateFontFingerprint() {
    return this.safeExecute(() => {
      const canvas = new OffscreenCanvas(100, 100)
      const ctx = canvas.getContext("2d")
      if (!ctx) return undefined

      const baseFonts = ["monospace", "sans-serif", "serif"]
      const testString = "mmmmmmmmmmlli"
      const testSize = "72px"
      const detectedFonts = []

      // Get baseline measurements
      const baselines = {}
      baseFonts.forEach((baseFont) => {
        ctx.font = `${testSize} ${baseFont}`
        baselines[baseFont] = ctx.measureText(testString).width
      })

      // Progressive font detection with yield points
      COMMON_FONTS.forEach((font, index) => {
        let detected = false

        baseFonts.forEach((baseFont) => {
          ctx.font = `${testSize} ${font}, ${baseFont}`
          const width = ctx.measureText(testString).width

          if (width !== baselines[baseFont]) {
            detected = true
          }
        })

        if (detected) {
          detectedFonts.push(font)
        }

        // Yield every 10 fonts to prevent blocking
        if (index % 10 === 0) {
          setTimeout(() => {}, 0)
        }
      })

      const signature = detectedFonts.sort().join(",")

      return {
        fonts: detectedFonts,
        count: detectedFonts.length,
        signature: btoa(signature).substring(0, 50),
      }
    }, "font_fingerprinting")
  }
}

// Worker message handler
self.onmessage = async (e) => {
  const { type, taskId, options = {} } = e.data
  const fingerprinter = new WorkerFingerprinter()

  try {
    let result
    const startTime = Date.now()

    switch (type) {
      case "canvas":
        result = await fingerprinter.generateCanvasFingerprint()
        break
      case "webgl":
        result = await fingerprinter.generateWebGLFingerprint()
        break
      case "fonts":
        result = fingerprinter.generateFontFingerprint()
        break
      case "cleanup":
        // Cleanup any resources
        result = { success: true }
        break
      default:
        throw new Error(`Unknown fingerprinting type: ${type}`)
    }

    const processingTime = Date.now() - startTime

    self.postMessage({
      taskId,
      type,
      success: true,
      result,
      processingTime,
      errors: fingerprinter.errors,
    })
  } catch (error) {
    self.postMessage({
      taskId,
      type,
      success: false,
      error: error.message,
      errors: fingerprinter.errors,
    })
  }
}

// Handle worker termination
self.onclose = () => {
  // Cleanup any remaining resources
  console.log("Fingerprinting worker terminated")
}
