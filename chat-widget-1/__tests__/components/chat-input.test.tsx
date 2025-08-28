import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChatInput from "@/components/chat-input";

// Mock image-compression globally for all tests
jest.mock("@/utils/image-compression", () => ({
  compressImage: jest.fn(async (file, { onProgress }) => {
    if (onProgress) onProgress(100);
    // Simulate async compression
    await new Promise((res) => setTimeout(res, 10));
    return new File(["compressed"], file.name, { type: file.type });
  }),
  getOptimalQuality: () => 0.7,
}));

describe("ChatInput Component", () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<ChatInput onSendMessage={mockOnSend} />);

    expect(
      screen.getByPlaceholderText(/type a message.../i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("updates input value when typing", () => {
    render(<ChatInput onSendMessage={mockOnSend} />);

    const input = screen.getByPlaceholderText(/type a message.../i);
    fireEvent.change(input, { target: { value: "Hello world" } });

    expect(input).toHaveValue("Hello world");
  });

  it("calls onSend when form is submitted with text", () => {
    render(<ChatInput onSendMessage={mockOnSend} />);

    const input = screen.getByPlaceholderText(/type a message.../i);
    fireEvent.change(input, { target: { value: "Hello world" } });

    const form = input.closest("form");
    if (form) fireEvent.submit(form);

    expect(mockOnSend).toHaveBeenCalledWith("Hello world");
    expect(input).toHaveValue("");
  });

  it("does not call onSend when form is submitted with empty text", () => {
    render(<ChatInput onSendMessage={mockOnSend} />);

    const form = screen
      .getByPlaceholderText(/type a message.../i)
      .closest("form");
    if (form) fireEvent.submit(form);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  // it("calls processAndSendFiles for image files and updates progress", async () => {
  //   render(<ChatInput onSendMessage={mockOnSend} />);
  //   const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
  //   const fileInput = screen.getByPlaceholderText(/type a message.../i).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
  //   expect(fileInput).toBeTruthy();
  //   fireEvent.change(fileInput, { target: { files: [file] } });
  //   // Wait for async processing UI
  //   expect(await screen.findByText(/processing file\(s\)\.\.\./i)).toBeInTheDocument();
  //   // Wait for onSendMessage to be called
  //   await screen.findByText("Powered by Kogents");
  //   expect(mockOnSend).toHaveBeenCalledWith("", [expect.any(File)]);
  // });

  // it("calls processAndSendFiles for non-image files", async () => {
  //   render(<ChatInput onSendMessage={mockOnSend} />);
  //   const file = new File(["dummy"], "test.pdf", { type: "application/pdf" });
  //   const fileInput = screen.getByPlaceholderText(/type a message.../i).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
  //   expect(fileInput).toBeTruthy();
  //   fireEvent.change(fileInput, { target: { files: [file] } });
  //   // Wait for onSendMessage to be called
  //   await screen.findByText("Powered by Kogents");
  //   expect(mockOnSend).toHaveBeenCalledWith("", [file]);
  // });

  // it("handles error in processAndSendFiles and sends original files", async () => {
  //   // Override compressImage to throw
  //   const { compressImage } = require("@/utils/image-compression");
  //   compressImage.mockImplementationOnce(() => { throw new Error("fail"); });
  //   jest.spyOn(console, "error").mockImplementation(() => {});
  //   render(<ChatInput onSendMessage={mockOnSend} />);
  //   const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
  //   const fileInput = screen.getByPlaceholderText(/type a message.../i).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
  //   expect(fileInput).toBeTruthy();
  //   fireEvent.change(fileInput, { target: { files: [file] } });
  //   await screen.findByText("Powered by Kogents");
  //   expect(mockOnSend).toHaveBeenCalledWith("", [file]);
  // });

  // it("shows processing indicator and progress bar when processingFiles is true", async () => {
  //   render(<ChatInput onSendMessage={mockOnSend} />);
  //   // Simulate image file upload to trigger processing state
  //   const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
  //   const fileInput = screen.getByPlaceholderText(/type a message.../i).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
  //   fireEvent.change(fileInput, { target: { files: [file] } });
  //   expect(await screen.findByText(/processing file\(s\)\.\.\./i)).toBeInTheDocument();
  //   expect(screen.getByText(/\d+%/)).toBeInTheDocument();
  // });

  // it("shows file preview when selectedFiles is not empty (UI coverage)", () => {
  //   // Simulate file selection by rendering the component with a file in selectedFiles
  //   // This requires a small refactor to expose selectedFiles for testing, or we can test via user event
  //   render(<ChatInput onSendMessage={mockOnSend} />);
  //   const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
  //   const fileInput = screen.getByPlaceholderText(/type a message.../i).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
  //   fireEvent.change(fileInput, { target: { files: [file] } });
  //   // FilePreview should be rendered
  //   expect(screen.getByText(/Powered by Kogents/)).toBeInTheDocument();
  //   // Optionally, check for the file name or remove button if rendered
  // });
});
