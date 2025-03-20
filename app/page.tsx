"use client";

import { useState } from "react";
import { Wand2, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setImage(data.imageUrl);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const preventCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: "Protected Content",
      description: "Please purchase to download this image",
      variant: "default",
    });
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: image }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment failed");
      }

      window.location.href = data.paymentUrl;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tighter">AI Image Generator</h1>
          <p className="text-muted-foreground">
            Transform your ideas into stunning images using AI
          </p>
        </div>

        <div className="space-y-4">
          <Textarea
            placeholder="Describe the image you want to generate..."
            className="min-h-[100px] resize-none"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <Button
            className="w-full"
            onClick={generateImage}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Generate Image
              </span>
            )}
          </Button>
        </div>

        {image && (
          <div className="space-y-4 relative group">
            <div className="relative">
              <img
                src={image}
                alt="Generated image"
                className="w-full rounded-lg shadow-lg select-none"
                onContextMenu={preventCopy}
                style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
                draggable="false"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="bg-white text-black hover:bg-white/90"
                >
                  {downloading ? (
                    <span className="flex items-center gap-2">
                      <Download className="h-4 w-4 animate-bounce" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download (₹5)
                    </span>
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              Protected image - Purchase to download
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}