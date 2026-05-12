import { chatJson } from "../lib/llm";
import { Item } from "../types";

interface SuggestionShape {
  suggestions: Array<{ name: string; itemIndices: number[]; explanation: string }>;
}

export const stylistService = {
  async getOutfitSuggestions(items: Item[], occasion: string, weather?: string) {
    if (items.length === 0) return null;

    const itemsSummary = items
      .map((i, idx) => `${idx}. ${i.name} (${i.category}${i.color ? `, ${i.color}` : ''})`)
      .join('\n');

    const prompt = `You are a professional high-end fashion stylist.
Wardrobe (each line is "<index>. <name> (<category>)"):
${itemsSummary}

Suggest 3 outfits for a ${occasion}${weather ? ` when the weather is ${weather}` : ''}.

Respond as a JSON object with exactly one key, "suggestions", whose value is an array of objects, each with:
- "name": short outfit name
- "itemIndices": array of integer indices from the wardrobe list above
- "explanation": one short chic sentence

JSON ONLY, no markdown.`;

    try {
      const data = await chatJson<SuggestionShape>(
        [{ role: 'user', content: prompt }],
        { maxTokens: 700 }
      );
      const suggestions = data?.suggestions || [];
      return suggestions.map(s => ({
        ...s,
        items: (s.itemIndices || []).map((idx: number) => items[idx]).filter(Boolean),
      }));
    } catch (error) {
      console.error('AI Stylist Error:', error);
      return null;
    }
  }
};
