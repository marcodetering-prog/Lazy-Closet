import { GoogleGenAI, Type } from "@google/genai";
import { Item } from "../types";

const ai = new GoogleGenAI({ apiKey: "browser-no-key", httpOptions: { baseUrl: window.location.origin + "/api/genai" } });

export const stylistService = {
  async getOutfitSuggestions(items: Item[], occasion: string, weather?: string) {
    if (items.length === 0) return null;

    const itemsSummary = items.map(i => `- ${i.name} (${i.category}${i.color ? `, ${i.color}` : ''})`).join('\n');
    
    const prompt = `You are a professional high-end fashion stylist. 
Given the following items in a user's wardrobe:
${itemsSummary}

Please suggest 3 outfits for a ${occasion} ${weather ? `when the weather is ${weather}` : ''}.
For each outfit, provide a name and a list of items from the wardrobe to combine.
Provide a brief stylistic explanation for each suggestion.
`;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                itemIndices: { 
                  type: Type.ARRAY, 
                  items: { type: Type.INTEGER },
                  description: "Indices of the items in the provided list"
                },
                explanation: { type: Type.STRING }
              },
              required: ["name", "itemIndices", "explanation"]
            }
          }
        }
      });

      const response = JSON.parse(result.text || '[]');
      return response.map((suggestion: any) => ({
        ...suggestion,
        items: suggestion.itemIndices.map((idx: number) => items[idx]).filter(Boolean)
      }));
    } catch (error) {
      console.error('AI Stylist Error:', error);
      return null;
    }
  }
};
