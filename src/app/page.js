"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { RotateCcw, Loader2, Moon, Sun, Download } from "lucide-react";

// --- HELPER FUNCTION ---
// Creates a playable WAV file from raw API audio data
function createWavFileBlob(pcmData, mimeType) {
  const sampleRateMatch = mimeType.match(/rate=(\d+)/);
  const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const dataLength = pcmData.length;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  function writeString(offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);
  return new Blob([view, pcmData], { type: "audio/wav" });
}

// --- UI COMPONENTS (Based on your new example) ---

function ThemeButton() {
  const { setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TopNav() {
  return (
    <header className="w-full border-b bg-background shadow-sm">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              TTS Playground
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeButton />
          </div>
        </div>
      </div>
    </header>
  );
}

function ControlsSidebar({
  model,
  setModel,
  modelOptions,
  voice,
  setVoice,
  voiceOptions,
  isLoading,
  onGenerate,
}) {
  return (
    <aside className="w-full md:w-80 md:min-w-80 border-l bg-background p-5 shadow-inner">
      <div className="flex flex-col gap-8">
        <section>
          <Label className="mb-2 block text-sm text-muted-foreground">
            Model
          </Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-full px-4 py-3 text-sm shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="shadow-lg">
              {modelOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section>
          <Label className="mb-2 block text-sm text-muted-foreground">
            Voice
          </Label>
          <Select value={voice} onValueChange={setVoice}>
            <SelectTrigger className="w-full px-4 py-3 text-sm shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="shadow-lg max-h-64">
              {voiceOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <div className="flex items-center gap-4 pt-4">
          <Button
            onClick={onGenerate}
            disabled={isLoading}
            className="flex-1 px-6 py-3 text-base font-medium shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Generating...
              </>
            ) : (
              "Generate"
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Undo"
            className="shadow-sm"
          >
            <RotateCcw className="size-5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

function Playground() {
  const [stylePrompt, setStylePrompt] = useState(
    "Read in a natural, conversational tone at a 1.1x speed, with clear pauses for light expressiveness, like an audiobook narration."
  );
  const [text, setText] = useState("How are you doing today?");
  const [model, setModel] = useState("gemini-2.5-pro-preview-tts");
  const [voice, setVoice] = useState("Puck");
  const [audioUrl, setAudioUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const modelOptions = [
    {
      value: "gemini-2.5-flash-preview-tts",
      label: "gemini-2.5-flash-preview-tts",
    },
    {
      value: "gemini-2.5-pro-preview-tts",
      label: "gemini-2.5-pro-preview-tts",
    },
  ];

  const voiceOptions = [
    // Full voice list from your screenshot
    { value: "Zephyr", label: "Zephyr – Bright" },
    { value: "Puck", label: "Puck – Upbeat" },
    { value: "Charon", label: "Charon – Informative" },
    { value: "Kore", label: "Kore – Firm" },
    { value: "Fenrir", label: "Fenrir – Excitable" },
    { value: "Leda", label: "Leda – Youthful" },
    { value: "Orus", label: "Orus – Firm" },
    { value: "Aoede", label: "Aoede – Breezy" },
    { value: "Callirrhoe", label: "Callirrhoe – Easy-going" },
    { value: "Autonoe", label: "Autonoe – Bright" },
    { value: "Enceladus", label: "Enceladus – Breathy" },
    { value: "Iapetus", label: "Iapetus – Clear" },
    { value: "Umbriel", label: "Umbriel – Easy-going" },
    { value: "Algieba", label: "Algieba – Smooth" },
    { value: "Despina", label: "Despina – Smooth" },
    { value: "Erinome", label: "Erinome – Clear" },
    { value: "Algenib", label: "Algenib – Gravelly" },
    { value: "Rasalgethi", label: "Rasalgethi – Informative" },
    { value: "Laomedeia", label: "Laomedeia – Upbeat" },
    { value: "Achernar", label: "Achernar – Soft" },
    { value: "Alnilam", label: "Alnilam – Firm" },
    { value: "Schedar", label: "Schedar – Even" },
    { value: "Gacrux", label: "Gacrux – Mature" },
    { value: "Pulcherrima", label: "Pulcherrima – Forward" },
    { value: "Achird", label: "Achird – Friendly" },
    { value: "Zubenelgenubi", label: "Zubenelgenubi – Casual" },
    { value: "Vindemiatrix", label: "Vindemiatrix – Gentle" },
    { value: "Sadachbia", label: "Sadachbia – Lively" },
    { value: "Sadaltager", label: "Sadaltager – Knowledgeable" },
    { value: "Sulafat", label: "Sulafat – Warm" },
  ];
  // Creates a sortable filename from the current date and time
  const getTimestampFilename = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    // Format: audio_YYYY-MM-DD_HH-MM-SS.wav
    return `audio_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.wav`;
  };

  // Triggers the browser to download the audio file with a custom filename

  const handleGenerateSpeech = async () => {
    setIsLoading(true);
    setError("");
    setAudioUrl("");

    if (!text.trim()) {
      setError("Please enter some text to generate speech.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/generate-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, stylePrompt, model }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate speech.");
      }

      const { audioContent, mimeType } = await response.json();
      if (!audioContent || !mimeType) throw new Error("Invalid data received.");

      const binaryString = atob(audioContent);
      const pcmData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        pcmData[i] = binaryString.charCodeAt(i);
      }

      const audioBlob = createWavFileBlob(pcmData, mimeType);
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (err) {
      console.error("Frontend error:", err);

      // Check if it's a network error (like being offline)
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError(
          "Network Error: Cannot connect to the server. Please check your connection."
        );
      } else {
        // Otherwise, show the error message from the server or a generic one
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;

    const filename = getTimestampFilename();
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // const handleGenerateSpeech = async () => {
  //   setIsLoading(true);
  //   setError("");
  //   setAudioUrl("");
  //   if (!text.trim()) {
  //     setError("Please enter some text to generate speech.");
  //     setIsLoading(false);
  //     return;
  //   }
  //   try {
  //     const response = await fetch("/api/generate-speech", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ text, voice, stylePrompt, model }),
  //     });
  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.error || "Something went wrong");
  //     }
  //     const { audioContent, mimeType } = await response.json();
  //     if (!audioContent || !mimeType) throw new Error("Invalid data received.");
  //     const binaryString = atob(audioContent);
  //     const pcmData = new Uint8Array(binaryString.length);
  //     for (let i = 0; i < binaryString.length; i++) {
  //       pcmData[i] = binaryString.charCodeAt(i);
  //     }
  //     const audioBlob = createWavFileBlob(pcmData, mimeType);
  //     const url = URL.createObjectURL(audioBlob);
  //     setAudioUrl(url);
  //   } catch (err) {
  //     console.error("Frontend error:", err);
  //     setError(err.message);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <Card className="bg-background border-border">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            <section className="flex-1">
              <div className="p-5">
                <Label
                  htmlFor="style"
                  className="mb-2 block text-sm text-muted-foreground"
                >
                  Style Instruction
                </Label>
                <Input
                  className={"text-sm"}
                  id="style"
                  placeholder="e.g., Read in a cheerful voice"
                  value={stylePrompt}
                  onChange={(e) => setStylePrompt(e.target.value)}
                />
              </div>
              <div className="p-5">
                <Label
                  htmlFor="prompt"
                  className="mb-2 block text-sm text-muted-foreground"
                >
                  Text
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Start typing here..."
                  className="min-h-[350px] w-full resize-vertical bg-background text-sm"
                  aria-label="Prompt editor"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
            </section>
            <ControlsSidebar
              model={model}
              setModel={setModel}
              modelOptions={modelOptions}
              voice={voice}
              setVoice={setVoice}
              voiceOptions={voiceOptions}
              isLoading={isLoading}
              onGenerate={handleGenerateSpeech}
            />
          </div>
        </CardContent>
        {/* <CardFooter className="flex items-center justify-between border-t border-border px-5 py-3 min-h-[70px]">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {audioUrl && (
            <div className="w-full">
              <audio controls autoPlay src={audioUrl} className="w-full">
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </CardFooter> */}
        <CardFooter className="flex items-center justify-between border-t border-border px-5 py-3 min-h-[70px]">
                    {error && <p className="text-red-500 text-sm">{error}</p>} 
                 {" "}
          {audioUrl && (
            <div className="w-full flex items-center gap-4">
              <audio controls autoPlay src={audioUrl} className="flex-grow">
                Your browser does not support the audio element.
              </audio>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                aria-label="Download audio"
              >
                <Download className="size-5" />
              </Button>
            </div>
          )}
                 {" "}
        </CardFooter>
      </Card>
    </main>
  );
}

export default function Page() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <TopNav />
      <Playground />
    </div>
  );
}
