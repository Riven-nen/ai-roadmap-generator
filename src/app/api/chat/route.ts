import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, courseTitle, courseContext } = await req.json();

    const systemPrompt = `You are an expert IT tutor helping a university student. 
    The student is currently studying the course: "${courseTitle}".
    
    Here is the exact syllabus they are looking at:
    ${courseContext}

    Use this syllabus as your primary context. If they ask about a topic in the syllabus, explain it based on that. 
    Answer their questions clearly, using analogies if helpful. Keep your answers concise and focused on IT concepts.
    Format your responses using Markdown (bullet points, bold text) for readability.`;

    const apiKey = process.env.GROQ_API_KEY;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("Groq API Error:", err);
        throw new Error("Chat API failed");
    }

    const data = await response.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
    
  } catch (error) {
    return NextResponse.json({ reply: "Sorry, I am having trouble connecting to my brain right now. Please try again." });
  }
}