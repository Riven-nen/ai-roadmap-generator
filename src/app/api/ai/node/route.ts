import { NextResponse } from "next/server";

type CourseContext = {
  code?: string;
  title?: string;
  description?: string;
  category?: string;
  level?: string;
};

type NodeContext = {
  title?: string;
  node_type?: string;
};

type OutlineItem = {
  title?: string;
  node_type?: string;
  description?: string;
};

type NodeRequest = {
  course?: CourseContext;
  node?: NodeContext;
  preceding?: OutlineItem[];
  outline?: OutlineItem[];
};

type GeneratedNodeContent = {
  description: string;
  overview: string;
  content: string;
  learning_objectives: string[];
  estimated_time: string;
  resource_name: string;
  resource_url: string;
};

function asText(value: unknown, limit = 8000): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function asList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asText(item, 300))
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeResult(value: unknown): GeneratedNodeContent {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const resourceUrl = asText(raw.resource_url, 500);

  return {
    description: asText(raw.description, 600),
    overview: asText(raw.overview, 1600),
    content: asText(raw.content, 6000),
    learning_objectives: asList(raw.learning_objectives),
    estimated_time: asText(raw.estimated_time, 60),
    resource_name: asText(raw.resource_name, 160),
    resource_url: /^https?:\/\//i.test(resourceUrl) ? resourceUrl : "",
  };
}

function parseJsonObject(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    // Some models add a sentence before or after the JSON object.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }

    throw new Error("No JSON object found");
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NodeRequest;
    const course = body.course ?? {};
    const node = body.node ?? {};
    const title = asText(node.title, 300);

    if (!title) {
      return NextResponse.json(
        { error: "Add a title before generating content." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "The AI service is not configured." },
        { status: 503 }
      );
    }

    const outline = (Array.isArray(body.outline) ? body.outline : [])
      .slice(0, 60)
      .map((item) => `- [${asText(item.node_type, 30) || "topic"}] ${asText(item.title, 240)}`)
      .filter((line) => line !== "- [topic] ")
      .join("\n");

    const preceding = (Array.isArray(body.preceding) ? body.preceding : [])
      .slice(0, 8)
      .map((item) => {
        const description = asText(item.description, 240);
        return `- [${asText(item.node_type, 30) || "topic"}] ${asText(item.title, 240)}${
          description ? ` — ${description}` : ""
        }`;
      })
      .filter((line) => line !== "- [topic] ")
      .join("\n");

    const systemPrompt = `You are an expert instructional designer building a university IT course roadmap.
Write accurate, concise, student-facing content for one roadmap node.

Return ONLY a JSON object with exactly these keys:
{
  "description": "One or two sentences shown on the roadmap card.",
  "overview": "A short 2-3 sentence introduction shown in the student modal.",
  "content": "Detailed study notes, instructions, or teaching content. Use short paragraphs or bullet points separated by newlines.",
  "learning_objectives": ["3 to 5 measurable objectives"],
  "estimated_time": "A realistic study time such as '20 mins' or '1 hour'.",
  "resource_name": "A reputable resource name, or an empty string.",
  "resource_url": "A real, stable URL from a reputable source, or an empty string."
}

Rules:
- The description must add information beyond the title. Never simply repeat the node title.
- Match the node type. A module needs a module-level overview and outcomes. A topic needs teaching content. A material needs a description of the resource and why it matters. Coursework needs clear deliverables and instructions. A quiz needs a short description of what it assesses, not the questions themselves.
- Build on the preceding nodes and do not repeat their content.
- Use the course title, description, and outline to keep the material aligned with the course.
- Do not invent prerequisite courses or claim resources exist unless you are confident the URL is real and stable.
- Do not use Markdown headings, but bullet lists and bold terms inside content are fine.
- Return valid JSON only. Do not wrap it in code fences.`;

    const userPrompt = `Course:
- Code: ${asText(course.code, 40) || "Unknown"}
- Title: ${asText(course.title, 200) || "Untitled course"}
- Description: ${asText(course.description, 1200) || "No description provided"}
- Category: ${asText(course.category, 80) || "Unknown"}
- Level: ${asText(course.level, 80) || "Unknown"}

Full roadmap outline:
${outline || "No other nodes yet."}

Immediate preceding nodes (prerequisites):
${preceding || "None. This is an introductory or root node."}

Target node:
- Title: ${title}
- Type: ${asText(node.node_type, 40) || "topic"}

Write the content for this node now.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        reasoning_effort: "low",
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq node generation error:", errorText);
      return NextResponse.json(
        { error: "The AI service could not generate this node. Try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent || typeof rawContent !== "string") {
      return NextResponse.json(
        { error: "The AI returned an empty response. Try again." },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = parseJsonObject(rawContent);
    } catch {
      console.error("Could not parse AI node JSON:", rawContent);
      return NextResponse.json(
        { error: "The AI returned content we could not read. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ content: normalizeResult(parsed) });
  } catch (error) {
    console.error("AI node route error:", error);
    return NextResponse.json(
      { error: "Could not generate the node. Try again." },
      { status: 500 }
    );
  }
}
