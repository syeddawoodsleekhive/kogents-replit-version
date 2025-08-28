import {
  compressImage,
  getOptimalQuality,
  formatFileSize,
  getCompressionRatio,
} from "../../utils/image-compression";

describe("image-compression utils", () => {
  it("getOptimalQuality returns correct quality", () => {
    expect(getOptimalQuality(6 * 1024 * 1024)).toBe(0.6);
    expect(getOptimalQuality(3 * 1024 * 1024)).toBe(0.7);
    expect(getOptimalQuality(1.5 * 1024 * 1024)).toBe(0.8);
    expect(getOptimalQuality(500 * 1024)).toBe(0.9);
  });

  it("formatFileSize returns correct string", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(2 * 1048576)).toBe("2.0 MB");
  });

  it("getCompressionRatio returns correct ratio", () => {
    expect(getCompressionRatio(1000, 500)).toBe("50%");
    expect(getCompressionRatio(2000, 1000)).toBe("50%");
    expect(getCompressionRatio(1000, 900)).toBe("10%");
  });

  it("compressImage returns original file for non-image", async () => {
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    const result = await compressImage(file);
    expect(result).toBe(file);
  });

  it("compressImage returns original file for SVG", async () => {
    const file = new File(["<svg></svg>"], "test.svg", {
      type: "image/svg+xml",
    });
    const result = await compressImage(file);
    expect(result).toBe(file);
  });

  // Note: Canvas/image compression happy-path is not tested here due to JSDOM limitations
});
