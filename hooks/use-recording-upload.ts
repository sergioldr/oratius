import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";
import { useCallback, useState } from "react";

import { supabase } from "@/lib/supabase";

interface UploadConfig {
  bucketName?: string;
}

interface UploadResult {
  success: boolean;
  recordingId?: string;
  error?: string;
}

interface UseRecordingUploadResult {
  isUploading: boolean;
  uploadRecording: (uri: string, userId: string) => Promise<UploadResult>;
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
 * Custom hook for uploading audio recordings to Supabase storage.
 * Handles file reading, upload, cleanup, and error management.
 * Automatically deletes local recordings after successful upload.
 */
export function useRecordingUpload(
  config?: UploadConfig
): UseRecordingUploadResult {
  const { bucketName = "dilo" } = config ?? {};
  const [isUploading, setIsUploading] = useState(false);

  const uploadRecording = useCallback(
    async (uri: string, userId: string): Promise<UploadResult> => {
      if (!uri || !userId) {
        return { success: false, error: "Missing URI or user ID" };
      }

      setIsUploading(true);

      try {
        const recordingId = Crypto.randomUUID();
        const fileExtension = uri.split(".").pop() ?? "m4a";
        const storagePath = `users/${userId}/recordings/${recordingId}.${fileExtension}`;

        // Read the file as bytes using the File API
        const recordingFile = new File(uri);
        const fileBytes = await recordingFile.bytes();

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, fileBytes.buffer, {
            contentType: `audio/${fileExtension}`,
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // Clean up local file even on failure to prevent accumulation
          deleteLocalFile(uri);
          return { success: false, error: "upload_failed" };
        }

        // Clean up local file after successful upload to prevent storage accumulation
        deleteLocalFile(uri);

        return { success: true, recordingId };
      } catch (error) {
        console.error("Failed to upload recording:", error);
        // Clean up local file even on failure to prevent accumulation
        deleteLocalFile(uri);
        return { success: false, error: "upload_failed" };
      } finally {
        setIsUploading(false);
      }
    },
    [bucketName]
  );

  return {
    isUploading,
    uploadRecording,
  };
}
