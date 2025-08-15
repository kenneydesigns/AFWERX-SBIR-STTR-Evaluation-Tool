import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  const body = await req.text();
  const { text } = JSON.parse(body || '{}');
  const rubric = [
    { key: "Significance", weight: 1.2, guidance: "Impact & problem clarity" },
    { key: "Innovation", weight: 1.0, guidance: "Novelty & differentiation" },
    { key: "Approach", weight: 1.4, guidance: "Method, risks, milestones" },
    { key: "Team/PI", weight: 0.8, guidance: "Qualifications & gaps" },
    { key: "Commercialization", weight: 1.6, guidance: "Path to revenue & market" }
  ];
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an SBIR evaluator. Return strictly JSON with {items:[{criterion_key,score,rationale}]}" },
        { role: "user", content: `Rubric: ${JSON.stringify(rubric)}\n---\nSection:\n${text?.slice(0, 6000) || ""}` }
      ],
      response_format: { type: "json_object" }
    });
    const data = JSON.parse(res.choices[0].message.content || '{"items":[]}');
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed", items: [] }, { status: 500 });
  }
}
