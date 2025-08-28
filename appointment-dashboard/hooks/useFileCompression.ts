import { useState, useCallback } from "react";
import { useCompressionWorker } from "./use-compression-worker";
import { validateFiles, DEFAULT_FILE_RESTRICTIONS } from "@/utils/file-rules";
import { useFileUpload } from "./useFileUpload";

interface UseFileCompressionProps {
  roomId: string;
  joinedChat: boolean;
  connected: boolean;
  emitSocketEvent?: (event: string, payload: any) => void;
}

export const useFileCompression = ({
  roomId,
  joinedChat,
  connected,
  emitSocketEvent,
}: UseFileCompressionProps) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [duplicateInfo, setDuplicateInfo] = useState<string>("");

  const { compressImage, uploadFileInChunks, createChunkedUploadTask } =
    useCompressionWorker();

  const { uploadFile, uploadFilesBatch } = useFileUpload({
    roomId,
    onUploadError: (fileId, error) => {
      console.error("File upload error:", error);
    },
    emitSocketEvent,
  });

  const processFilesForCompression = useCallback(
    async (files: File[]): Promise<File[]> => {
      const processedFiles: File[] = [];
      const compressionThreshold = 100 * 1024;
      const chunkedUploadThreshold = 10 * 1024 * 1024;

      for (const file of files) {
        if (file.size > chunkedUploadThreshold) {
          try {
            setIsCompressing(true);
            setCompressionProgress(0);

            const chunkedTask = createChunkedUploadTask(file, 2 * 1024 * 1024);

            await new Promise<void>((resolve, reject) => {
              chunkedTask.onProgress = (progress) => {
                setCompressionProgress(progress);
              };

              chunkedTask.onComplete = (result) => {
                const processedFile = new File([result.blob], file.name, {
                  type: result.outputFormat,
                  lastModified: Date.now(),
                });
                processedFiles.push(processedFile);
                resolve();
              };

              chunkedTask.onError = (error) => {
                reject(new Error(`Chunked upload failed: ${error}`));
              };

              uploadFileInChunks(chunkedTask);
            });
          } catch (error) {
            console.warn(
              `Failed to upload ${file.name} in chunks, using original:`,
              error
            );
            processedFiles.push(file);
          } finally {
            setIsCompressing(false);
            setCompressionProgress(0);
          }
        } else if (
          file.size > compressionThreshold &&
          file.type.startsWith("image/")
        ) {
          try {
            setIsCompressing(true);
            setCompressionProgress(0);

            const compressedFile = await compressImageFile(file);
            processedFiles.push(compressedFile);
          } catch (error) {
            console.warn(
              `Failed to compress ${file.name}, using original:`,
              error
            );
            processedFiles.push(file);
          } finally {
            setIsCompressing(false);
            setCompressionProgress(0);
          }
        } else {
          processedFiles.push(file);
        }
      }

      return processedFiles;
    },
    [compressImage, uploadFileInChunks, createChunkedUploadTask]
  );

  const compressImageFile = useCallback(
    async (file: File): Promise<File> => {
      return new Promise((resolve, reject) => {
        const taskId = `compress-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        compressImage({
          id: taskId,
          file,
          options: {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.8,
          },
          onProgress: (progress) => {
            setCompressionProgress(progress);
          },
          onComplete: (result) => {
            const compressedFile = new File([result.blob], file.name, {
              type: result.outputFormat,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          onError: (error) => {
            reject(new Error(`Compression failed: ${error}`));
          },
        });
      });
    },
    [compressImage]
  );

  const testDuplicateDetection = useCallback(() => {
    console.log("🧪 Testing duplicate detection...");

    const testFile1 = new File(["test content"], "test1.jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    const testFile2 = new File(["test content"], "test1.jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    const testFile3 = new File(["different content"], "test2.jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    const testFiles = [testFile1, testFile2, testFile3];
    console.log(
      "�� Test files created:",
      testFiles.map((f) => ({
        name: f.name,
        size: f.size,
        lastModified: f.lastModified,
      }))
    );

    const uniqueFiles: File[] = [];
    const seenFiles = new Set<string>();
    const duplicateFiles: string[] = [];

    for (const file of testFiles) {
      const fileKey = `${file.name}_${file.size}_${file.lastModified}`;
      console.log(`🧪 Processing test file: ${file.name} (${fileKey})`);

      if (seenFiles.has(fileKey)) {
        console.log(`�� Duplicate detected: ${file.name}`);
        duplicateFiles.push(file.name);
        continue;
      }

      console.log(`�� Adding unique test file: ${file.name}`);
      seenFiles.add(fileKey);
      uniqueFiles.push(file);
    }

    console.log(
      `🧪 Test results: ${testFiles.length} total, ${uniqueFiles.length} unique, ${duplicateFiles.length} duplicates`
    );
    console.log(
      "🧪 Unique files:",
      uniqueFiles.map((f) => f.name)
    );
    console.log("�� Duplicate files:", duplicateFiles);
  }, []);

  const handleFileSelected = useCallback(
    async (files: File[]) => {
      if (!joinedChat || !connected) return;

      console.log(
        "🔍 Processing files for duplicates:",
        files.map((f) => ({
          name: f.name,
          size: f.size,
          lastModified: f.lastModified,
        }))
      );

      try {
        const uniqueFiles: File[] = [];
        const seenFiles = new Set<string>();
        const duplicateFiles: string[] = [];

        for (const file of files) {
          const fileKey = `${file.name}_${file.size}_${file.lastModified}`;
          console.log(`📁 Processing file: ${file.name} (${fileKey})`);

          if (seenFiles.has(fileKey)) {
            console.log(`❌ Duplicate detected: ${file.name}`);
            duplicateFiles.push(file.name);
            continue;
          }

          console.log(`✅ Adding unique file: ${file.name}`);
          seenFiles.add(fileKey);
          uniqueFiles.push(file);
        }

        console.log(
          `📊 Results: ${files.length} total, ${uniqueFiles.length} unique, ${duplicateFiles.length} duplicates`
        );

        if (duplicateFiles.length > 0) {
          const duplicateMessage =
            duplicateFiles.length === 1
              ? `1 duplicate file (${duplicateFiles[0]}) was automatically removed`
              : `${duplicateFiles.length} duplicate files were automatically removed`;

          setDuplicateInfo(duplicateMessage);

          setTimeout(() => setDuplicateInfo(""), 3000);
        }

        if (uniqueFiles.length === 0) {
          setDuplicateInfo("All files were duplicates and have been removed");
          setTimeout(() => setDuplicateInfo(""), 3000);
          return;
        }

        const validationResult = await validateFiles(
          uniqueFiles,
          DEFAULT_FILE_RESTRICTIONS
        );

        if (validationResult.isValid) {
          const processedFiles = await processFilesForCompression(uniqueFiles);
          if (processedFiles.length > 0) {
            console.log(
              `🚀 Starting upload for ${processedFiles.length} processed files`
            );

            // Use batch upload for multiple files, single upload for one file
            if (processedFiles.length === 1) {
              await uploadFile(processedFiles[0]);
            } else {
              await uploadFilesBatch(processedFiles);
            }
          }
        } else {
          const errorMessage = validationResult.errors.join("\n• ");
          const warningMessage =
            validationResult.warnings.length > 0
              ? `\n\nWarnings:\n• ${validationResult.warnings.join("\n• ")}`
              : "";

          if (validationResult.errors.length > 0) {
            alert(
              `Some files couldn't be uploaded:\n\n• ${errorMessage}${warningMessage}`
            );
          } else if (validationResult.warnings.length > 0) {
            alert(`Files uploaded with warnings:\n\n• ${warningMessage}`);
            const processedFiles = await processFilesForCompression(
              uniqueFiles
            );
          }
        }
      } catch (error) {
        console.error("File validation error:", error);
        alert("Error validating files. Please try again.");
      }
    },
    [roomId, joinedChat, connected, processFilesForCompression, uploadFile, uploadFilesBatch]
  );

  const clearDuplicateInfo = useCallback(() => {
    setDuplicateInfo("");
  }, []);

  return {
    isCompressing,
    compressionProgress,
    duplicateInfo,
    handleFileSelected,
    testDuplicateDetection,
    clearDuplicateInfo,
  };
};
