import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

const ReceiptSchema = z.object({
    receipt: z.object({
        id: z.string(),
        nameOfStore: z.string(),
        total: z.number(),
        paidBy: z.string(),
        date: z.string(), // Adjust the type if necessary
    }),
    items: z.array(z.object({
        name: z.string(),
        amount: z.number(),
        sharedWith: z.array(z.string()),
    })),
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const image = formData.get('image');

        // Check if the image exists and is a valid file
        if (!(image instanceof File)) {
            return NextResponse.json({ error: 'No image provided or invalid file type' }, { status: 400 });
        }

        // Convert image to base64
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');

        // Optionally add MIME type prefix
        const mimeType = image.type; // e.g., 'image/jpeg'
        const base64WithPrefix = `data:${mimeType};base64,${base64Image}`;


        // Call OpenAI API
        const response = await openai.beta.chat.completions.parse({
            model: "gpt-4o-mini",
            temperature: 0,
            max_tokens: 1024,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Extract the receipt data from the image. Response with empty object if you cannot parse the receipt image.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: base64WithPrefix
                            }
                        }]
                }
            ],
            response_format: zodResponseFormat(ReceiptSchema, "receiptData"),
        });

        const result = response.choices[0].message.parsed;
        console.log(result)
        return NextResponse.json(result)
    } catch (error) {
        console.error('Error processing receipt:', error)
        return NextResponse.json(
            { error: 'Failed to process receipt' },
            { status: 500 }
        )
    }
} 