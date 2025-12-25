import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { router } from "expo-router";
import { useEffect } from "react";

interface UseAudioProcessingParams {
  recordingId?: string;
  mode?: string;
  type?: string;
}

export function useAudioProcessing({
  recordingId,
  mode,
  type,
}: UseAudioProcessingParams) {
  useEffect(() => {
    if (!recordingId) {
      console.error("No recording ID provided");
      router.replace({
        pathname: "/recording-error",
        params: {
          error: "No recording ID provided",
        },
      });
      return;
    }

    let channel: RealtimeChannel | null = null;

    const subscribeToProcessing = async () => {
      try {
        // Subscribe to real-time updates for this audio processing job
        channel = supabase
          .channel(`processing:${recordingId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "audio_processing",
              filter: `audio_id=eq.${recordingId}`,
            },
            (payload) => {
              const newStatus = payload.new.status as string;
              console.log("Processing status updated:", newStatus);

              if (newStatus === "complete") {
                // Navigate to feedback screen with results
                channel?.unsubscribe();
                router.replace({
                  pathname: "/(auth)/(tabs)/feedback",
                  params: {
                    recordingId,
                    results: JSON.stringify(payload.new.results || {}),
                  },
                });
              } else if (newStatus === "failed") {
                // Navigate to error screen
                channel?.unsubscribe();
                router.replace({
                  pathname: "/recording-error",
                  params: {
                    error: payload.new.error_message || "Processing failed",
                  },
                });
              }
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log("Subscribed to processing updates");
            } else if (status === "CHANNEL_ERROR") {
              console.error("Subscription error");
              router.replace({
                pathname: "/recording-error",
                params: {
                  error: "Failed to connect to processing service",
                },
              });
            }
          });

        // Also check current status in case it's already complete/failed
        const { data, error } = await supabase
          .from("audio_processing")
          .select("status, results, error_message")
          .eq("audio_id", recordingId)
          .single();

        if (error) {
          console.error("Error fetching processing status:", error);
          return;
        }

        if (data) {
          const currentStatus = data.status;

          if (currentStatus === "complete") {
            channel?.unsubscribe();
            router.replace({
              pathname: "/(auth)/(tabs)/feedback",
              params: {
                recordingId,
                results: JSON.stringify(data.results || {}),
              },
            });
          } else if (currentStatus === "failed") {
            channel?.unsubscribe();
            router.replace({
              pathname: "/recording-error",
              params: {
                error: data.error_message || "Processing failed",
              },
            });
          }
        }
      } catch (error) {
        console.error("Error setting up subscription:", error);
        router.replace({
          pathname: "/recording-error",
          params: {
            error: "Failed to monitor processing status",
          },
        });
      }
    };

    subscribeToProcessing();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        console.log("Unsubscribing from processing updates");
        channel.unsubscribe();
      }
    };
  }, [recordingId, mode, type]);
}
