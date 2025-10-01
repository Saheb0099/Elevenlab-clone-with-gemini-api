import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { text, voice, stylePrompt, model } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text input is required." },
        { status: 400 }
      );
    }

    const selectedModel = model || "gemini-2.5-flash-preview-tts";
    // If a style prompt is provided, prepend it. Otherwise, use the text directly.
    const fullPrompt = stylePrompt
      ? `Read aloud ${stylePrompt}: ${text}`
      : text;

    const response = await genAI.models.generateContent({
      model: selectedModel,
      contents: [
        {
          parts: [{ text: fullPrompt }],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || "Kore" },
          },
        },
      },
    });

    // --- UPDATED SECTION ---
    // Extract the entire first part of the response
    const audioPart = response.candidates?.[0]?.content?.parts?.[0];

    if (!audioPart || !audioPart.inlineData) {
      throw new Error(
        "No valid content part with inlineData found in the API response."
      );
    }

    // Extract both the data and the mimeType
    const data = audioPart.inlineData.data;
    const mimeType = audioPart.inlineData.mimeType;

    if (!data || !mimeType) {
      throw new Error("API response is missing audio data or mimeType.");
    }

    // Return both pieces of information to the frontend
    return NextResponse.json({ audioContent: data, mimeType: mimeType });
    // --- END OF UPDATE ---
  } catch (error) {
    console.error("Error in Gemini TTS generation:", error);
    return NextResponse.json(
      { error: "Failed to generate speech. Please check the server logs." },
      { status: 500 }
    );
  }
}
