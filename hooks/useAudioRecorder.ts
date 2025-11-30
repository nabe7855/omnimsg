import { supabase } from "@/lib/supabaseClient";
import { MessageType } from "@/lib/types";
import { useRef, useState } from "react";

const MAX_RECORDING_TIME_MS = 60000;
const MAX_AUDIO_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const useAudioRecorder = (
  roomId: string,
  currentUser: any,
  onSend: (msg: any) => void
) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isCancelledRef = useRef(false);
  const mimeTypeRef = useRef<string>("audio/webm");
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus"))
        mimeType = "audio/webm;codecs=opus";
      else if (MediaRecorder.isTypeSupported("audio/mp4"))
        mimeType = "audio/mp4";
      else if (MediaRecorder.isTypeSupported("audio/ogg"))
        mimeType = "audio/ogg";

      mimeTypeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
        if (isCancelledRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeTypeRef.current,
        });
        if (audioBlob.size > MAX_AUDIO_FILE_SIZE_BYTES) {
          alert("ファイルサイズが大きすぎます");
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        await uploadAudio(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(1000);
      setIsRecording(true);

      recordingTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopRecording();
          alert("録音時間は最大60秒です");
        }
      }, MAX_RECORDING_TIME_MS);
    } catch (err) {
      console.error(err);
      alert("マイクの使用を許可してください");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async (audioBlob: Blob) => {
    if (!currentUser) return;
    try {
      const ext = mimeTypeRef.current.includes("mp4") ? "mp4" : "webm";
      const fileName = `${Date.now()}-${Math.random()}.${ext}`;
      const filePath = `${roomId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(filePath, audioBlob, { contentType: mimeTypeRef.current });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-images").getPublicUrl(filePath);

      const { data: insertedMsg, error } = await supabase
        .from("messages")
        .insert([
          {
            room_id: roomId,
            sender_id: currentUser.id,
            content: publicUrl,
            message_type: MessageType.AUDIO,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (insertedMsg) onSend(insertedMsg);

      await supabase
        .from("rooms")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", roomId);
    } catch (e) {
      console.error(e);
      alert("送信失敗");
    }
  };

  return { isRecording, startRecording, stopRecording, cancelRecording };
};
