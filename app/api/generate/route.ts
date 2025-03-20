import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: 'https://api.studio.nebius.com/v1/',
  apiKey: process.env.NEBIUS_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Generate embedding for the prompt
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const embeddingResult = await model.embedContent(prompt);
    const embeddingValues = embeddingResult.embedding.values;

    if (!Array.isArray(embeddingValues) || embeddingValues.length !== 768) {
      throw new Error('Invalid embedding format');
    }

    // Check for similar existing images
    const { data: similarImages, error: searchError } = await supabase.rpc(
      'find_similar_image',
      {
        query_embedding: embeddingValues,
        similarity_threshold: 0.8
      }
    );

    if (searchError) {
      console.error('Similarity search error:', searchError);
      throw searchError;
    }

    // If similar image found, return it
    if (similarImages && similarImages.length > 0) {
      console.log('Found similar image:', similarImages[0].prompt);
      return NextResponse.json({ 
        imageUrl: similarImages[0].image_url,
        cached: true,
        similarity: similarImages[0].similarity
      });
    }

    // Generate new image if no similar one found
    const response = await client.images.generate({
      model: 'black-forest-labs/flux-schnell',
      response_format: 'url',
      extra_body: {
        response_extension: 'webp',
        width: 1024,
        height: 1024,
        num_inference_steps: 28,
        negative_prompt: '',
        seed: -1,
      },
      prompt: prompt,
    });

    // Store the new image with its embedding
    const { error: insertError } = await supabase
      .from('generated_images')
      .insert({
        prompt: prompt,
        prompt_embedding: embeddingValues,
        image_url: response.data[0].url,
        nebius_id: response.id,
        metadata: {
          width: 1024,
          height: 1024,
          format: 'webp'
        }
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    return NextResponse.json({ 
      imageUrl: response.data[0].url,
      cached: false 
    });

  } catch (error: any) {
    console.error('Error in image generation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
