import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type RubricItem = { key: string; weight: number; guidance?: string };

export async function scoreSection(sectionText: string, rubric: RubricItem[]) {
  const sys = `You are an SBIR evaluator. Score strictly per rubric. Return JSON: {"items":[{"criterion_key":"","score":0,"rationale":""}]}`;
  const user = `Rubric: ${JSON.stringify(rubric)}\n---\nSection:\n${sectionText}`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: sys }, { role: "user", content: user }],
    response_format: { type: "json_object" }
  });

  const content = res.choices[0].message.content || "{}";
  return JSON.parse(content);
}
