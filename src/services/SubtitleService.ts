import { GoogleGenAI, Type } from "@google/genai";

export interface SubtitleEntry {
  start: string;
  end: string;
  text: string;
}

export class SubtitleService {
  /**
   * Generates subtitle entries using Google Gemini API
   * @param apiKey The Gemini API Key retrieved from localStorage
   * @param videoName The name of the video
   * @param clipInfo Optional information about the selected clip segment
   */
  static async generateSubtitles(
    apiKey: string,
    videoName: string,
    clipInfo?: {
      title: string;
      description: string;
      startTime: number;
      endTime: number;
    }
  ): Promise<SubtitleEntry[]> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error("Gemini API Key Required.");
    }

    // Initialize the official @google/genai SDK
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const clipTitle = clipInfo?.title || "Video Clip";
    const clipDescription = clipInfo?.description || "Segment of video";
    const startTime = clipInfo?.startTime !== undefined ? clipInfo.startTime : 0;
    const endTime = clipInfo?.endTime !== undefined ? clipInfo.endTime : 10;
    const duration = Math.max(1, endTime - startTime);

    const prompt = `Hasilkan subtitle kreatif dan kontekstual untuk potongan video pendek berikut.
Nama Video Asli: ${videoName}
Judul Clip: ${clipTitle}
Deskripsi Clip: ${clipDescription}
Rentang Waktu Clip: detik ke-${startTime} sampai detik ke-${endTime} (Total durasi: ${duration} detik)

Tugas Anda:
Buat deretan subtitle yang dinamis dan menarik dalam Bahasa Indonesia, selaras dengan deskripsi di atas.
Timestamp start dan end wajib menyebar secara merata dan logis dalam rentang durasi ${duration} detik tersebut. Format timestamp harus mm:ss (misalnya mulai dari '00:00').
Hasilkan sekitar 3 hingga 6 baris subtitle agar terasa padat dan profesional.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Anda adalah asisten AI profesional untuk CreatorOS yang bertugas menghasilkan subtitle (captions) video pendek viral dalam format JSON terstruktur.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                start: {
                  type: Type.STRING,
                  description: "Waktu mulai dalam format mm:ss (contoh: '00:00' atau '00:04')",
                },
                end: {
                  type: Type.STRING,
                  description: "Waktu selesai dalam format mm:ss (contoh: '00:02' atau '00:06')",
                },
                text: {
                  type: Type.STRING,
                  description: "Teks subtitle yang diucapkan dalam Bahasa Indonesia yang menarik dan kasual.",
                },
              },
              required: ["start", "end", "text"],
            },
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Failed to receive content from Gemini API.");
      }

      const parsed = JSON.parse(responseText.trim());
      if (Array.isArray(parsed)) {
        return parsed as SubtitleEntry[];
      }

      throw new Error("Invalid output format from Gemini model.");
    } catch (error: any) {
      console.error("[SubtitleService Error] Failed to generate subtitles:", error);
      throw new Error(error.message || "Gagal menghubungi Gemini API.");
    }
  }
}
