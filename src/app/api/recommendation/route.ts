import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { skills, targetCareer, missingRequirement, weakCourses } = await req.json();

    const careerName = targetCareer || "Software Engineer";
    const weakList = weakCourses && weakCourses.length > 0 ? weakCourses.join(", ") : "None";

    const prompt = `You are a strict but encouraging academic advisor. 
    
    Student Data:
    - Current Domain Scores: ${JSON.stringify(skills)}
    - Courses they struggled with: ${weakList}
    - Target Career: ${careerName}
    - Missing Requirement: ${missingRequirement || "None"}

    Task: Write a highly specific, 3-sentence academic advice. 
    Sentence 1: Mention their target career and acknowledge their current strengths.
    Sentence 2: Directly reference the specific course they struggled with (${weakList}) and explain how it creates a gap in their skills.
    Sentence 3: Give a concrete action plan (e.g., retake the course, specific elective to take, or project to build) to fix this gap.`;

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
          { 
            role: "system", 
            content: "You are a direct, helpful academic advisor. Do not include your reasoning. Only provide the final 3 sentences." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 500, 
      }),
    });

    const data = await response.json();
    
    let aiText = data?.choices?.[0]?.message?.content;
    
    if (!aiText || aiText.trim() === "") {
        aiText = `You are close to becoming a ${careerName}. However, your struggles in ${weakList} are holding you back. Focus on retaking these subjects and building projects in ${missingRequirement || "your weak domains"} to close the gap.`;
    }

    return NextResponse.json({ recommendation: aiText });
    
  } catch (error) {
    return NextResponse.json({ recommendation: "Focus on improving your weak domains to stay on track for graduation." });
  }
}