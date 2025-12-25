import { File } from "expo-file-system";
import { useCallback, useState } from "react";

interface UploadResult {
  success: boolean;
  recordingId?: string;
  error?: string;
}

interface UseRecordingUploadResult {
  isUploading: boolean;
  uploadRecording: (uri: string, userId: string) => Promise<UploadResult>;
}

interface UploadUrlResponse {
  audioId: string;
  storagePath: string;
  uploadUrl: string;
  expiresIn: number;
}

/**
 * Deletes a local file from the device using the modern File API.
 * Used to clean up recordings to prevent storage accumulation.
 * @param uri - The file URI to delete
 */
export function deleteLocalFile(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    // Log but don't throw - cleanup failure shouldn't affect other operations
    console.warn("Failed to delete local recording file:", error);
  }
}

/**
 * Custom hook for uploading audio recordings to storage via presigned URLs.
 * Handles file reading, upload, cleanup, and error management.
 * Automatically deletes local recordings after successful upload.
 */
export function useRecordingUpload(): UseRecordingUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const apiUrl = process.env.EXPO_PUBLIC_DILO_SERVER_API_URL;

  const uploadRecording = useCallback(
    async (uri: string, userId: string): Promise<UploadResult> => {
      if (!uri || !userId) {
        return { success: false, error: "Missing URI or user ID" };
      }

      if (!apiUrl) {
        console.error("API URL not configured");
        return { success: false, error: "API URL not configured" };
      }

      setIsUploading(true);

      try {
        // Extract file extension and determine mime type
        const fileExtension = uri.split(".").pop() ?? "m4a";
        const mimeType = `audio/${fileExtension}`;

        // Step 1: Get presigned URL from backend
        const uploadUrlResponse = await fetch(`${apiUrl}/v1/audio/upload-url`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mimeType,
            fileExtension,
          }),
        });

        if (!uploadUrlResponse.ok) {
          console.error("Failed to get upload URL:", uploadUrlResponse.status);
          deleteLocalFile(uri);
          return { success: false, error: "failed_to_get_upload_url" };
        }

        const uploadData: UploadUrlResponse = await uploadUrlResponse.json();

        // Step 2: Read the file as bytes using the File API
        const recordingFile = new File(uri);
        const fileBytes = await recordingFile.bytes();

        // Step 3: Upload to presigned URL
        const uploadResponse = await fetch(uploadData.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": mimeType,
          },
          body: fileBytes.buffer,
        });

        if (!uploadResponse.ok) {
          console.error(
            "Upload to presigned URL failed:",
            uploadResponse.status
          );
          deleteLocalFile(uri);
          return { success: false, error: "upload_failed" };
        }

        // Clean up local file after successful upload to prevent storage accumulation
        deleteLocalFile(uri);

        return { success: true, recordingId: uploadData.audioId };
      } catch (error) {
        console.error("Failed to upload recording:", error);
        // Clean up local file even on failure to prevent accumulation
        deleteLocalFile(uri);
        return { success: false, error: "upload_failed" };
      } finally {
        setIsUploading(false);
      }
    },
    [apiUrl]
  );

  return {
    isUploading,
    uploadRecording,
  };
}
