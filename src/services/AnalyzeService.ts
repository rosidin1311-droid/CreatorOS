import { GoogleGenAI, Type } from "@google/genai";

export interface AnalyzedClip {
  id: number;
  title: string;
  start: string;
  end: string;
  virality: number;
  confidence: number;
  category: string;
  description?: string;
}

export class AnalyzeService {
  /**
   * Analyzes a video to detect interesting short-form moments using Google Gemini API
   * @param apiKey The Gemini API Key retrieved from localStorage
   * @param videoName The name/metadata of the video being analyzed
   */
  static async analyzeHighlights(
    apiKey: string,
    videoName: string
  ): Promise<AnalyzedClip[]> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error("❌ Gemini API Key Required.");
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

    const prompt = `Analisis video berikut untuk mendeteksi momen-momen paling menarik, lucu, atau bernilai viral tinggi (viral short-form moments/highlights).
Nama Video: ${videoName}

Tugas Anda:
Pilih 3 hingga 5 momen potongan (clip highlights) terbaik dari video ini. 
Setiap momen harus memiliki rentang waktu (start dan end dalam format mm:ss, contoh '00:05' sampai '00:18'), skor virality tinggi (antara 80-100), keyakinan deteksi (confidence score 80-100), kategori yang relevan (seperti 'Business', 'Marketing', 'Football', 'Comedy', 'Insight'), serta deskripsi ringkas yang menjelaskan isi segmen tersebut.
Pastikan urutan ID dimulai dari 1 dan berurutan secara logis sesuai alur waktu video.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Anda adalah analis konten video AI senior untuk CreatorOS yang bertugas mendeteksi momen-momen sorotan (highlights) terbaik dari video berdurasi panjang dalam format JSON terstruktur.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: {
                  type: Type.INTEGER,
                  description: "ID berurutan dari 1, 2, dst."
                },
                title: {
                  type: Type.STRING,
                  description: "Judul yang menarik dan memicu rasa ingin tahu (clickworthy title) untuk clip ini."
                },
                start: {
                  type: Type.STRING,
                  description: "Waktu mulai momen tersebut dalam format mm:ss (contoh: '00:05')."
                },
                end: {
                  type: Type.STRING,
                  description: "Waktu selesai momen tersebut dalam format mm:ss (contoh: '00:18')."
                },
                virality: {
                  type: Type.INTEGER,
                  description: "Indeks potensi viralitas dari 0 hingga 100."
                },
                confidence: {
                  type: Type.INTEGER,
                  description: "Skor keyakinan analisis model dari 0 hingga 100."
                },
                category: {
                  type: Type.STRING,
                  description: "Kategori/topik utama momen tersebut (contoh: 'Goal Celebration', 'Business Idea')."
                },
                description: {
                  type: Type.STRING,
                  description: "Deskripsi singkat yang merangkum apa yang dibahas dalam klip video pendek ini."
                }
              },
              required: ["id", "title", "start", "end", "virality", "confidence", "category"]
            }
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Failed to receive content from Gemini API.");
      }

      const parsed = JSON.parse(responseText.trim());
      if (Array.isArray(parsed)) {
        return parsed as AnalyzedClip[];
      }

      throw new Error("Invalid output format from Gemini model.");
    } catch (error: any) {
      console.error("[AnalyzeService Error] Failed to analyze video highlights:", error);
      throw new Error(error.message || "Gagal menghubungi Gemini API untuk menganalisis video.");
    }
  }
}
