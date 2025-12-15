
import { Student, ClassSession, CoCurricularActivity } from "../types";

// Helper to safely get the client only when needed using Dynamic Import
const getAiClient = async () => {
  try {
    // Dynamic import to prevent initial load crash
    const { GoogleGenAI } = await import("@google/genai");
    
    let apiKey = '';
    try {
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
          apiKey = process.env.API_KEY;
      }
    } catch (e) {
      console.warn("process.env access failed.");
    }
    
    // Fallback key to allow instantiation, actual call will fail gracefully if invalid
    return new GoogleGenAI({ apiKey: apiKey || 'missing_api_key' });
  } catch (error) {
    console.error("Failed to load Google GenAI SDK", error);
    throw new Error("AI SDK could not be loaded.");
  }
};

export const generateSchoolNotice = async (
  topic: string,
  audience: string,
  tone: string = "Formal"
): Promise<string> => {
  try {
    const ai = await getAiClient();
    const prompt = `
      You are an expert School Administrator for a prestigious CBSE school in New Delhi.
      Write a school notice/circular.
      
      Topic: ${topic}
      Audience: ${audience}
      Tone: ${tone}
      
      Requirements:
      1. Use professional, clear English suitable for an Indian academic context.
      2. Include placeholders for Date, Ref No, and Principal's Signature if necessary.
      3. If the topic involves holidays or timings, keep New Delhi weather/traffic context in mind implicitly if relevant.
      4. Format it clearly with a subject line.
      
      Return ONLY the content of the notice.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Failed to generate notice.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content. Please check if your API key is configured in the deployment environment.";
  }
};

export const analyzeStudentPerformance = async (studentName: string, marksData: string): Promise<string> => {
    try {
        const ai = await getAiClient();
        const prompt = `
          You are a senior academic coordinator. Analyze the following performance data for student ${studentName}.
          Data: ${marksData}
          
          Provide a 3-sentence summary for the Report Card remarks:
          1. A positive observation.
          2. An area of improvement.
          3. A specific suggestion for the parents.
        `;
    
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
    
        return response.text || "Could not analyze data.";
      } catch (error) {
        console.error("Gemini API Error:", error);
        return "Error analyzing performance. Please check API key configuration.";
      }
}

export const analyzeStudentFactors = async (
  student: Student,
  missedSessions: ClassSession[],
  activities: CoCurricularActivity[]
): Promise<string> => {
  try {
    const ai = await getAiClient();
    const missedTopics = missedSessions.map(s => `${s.subject}: ${s.topic} (${s.date})`).join(', ');
    const activitySummary = activities.map(a => `${a.name} (${a.hoursSpent} hrs) - ${a.achievement || 'Participant'}`).join(', ');
    
    // Format Exam Results
    const examTrends = student.examResults?.map(e => 
      `${e.examName}: ${e.totalPercentage}% (Key Scores: ${e.subjects.filter(s => s.score < 60 || s.score > 90).map(s => `${s.subject}: ${s.score}`).join(', ')})`
    ).join(' | ') || "No Exam Data";

    const prompt = `
      Analyze the factors influencing the academic journey of student: ${student.name} (Class ${student.className || 'Unknown'}).
      
      DATA POINTS:
      1. Exam History: ${examTrends}
      2. Missed Topics (Absence): ${missedTopics || "None"}
      3. Co-Curricular Load: ${activitySummary || "None"}
      4. General Attendance: ${student.attendancePercentage}%
      
      TASK:
      Provide a "Holistic Observation" report.
      
      GUIDELINES (IMPORTANT):
      1. Be supportive and constructive. Do NOT be diagnostic or judgmental.
      2. Use phrases like "may suggest", "could be related to", or "consider reviewing".
      3. Do NOT make definitive medical or psychological claims.
      4. Do NOT comment on financial status even if data implies it.
      
      STRUCTURE:
      1. Observations: Note any patterns (e.g., correlations between absence dates and specific topic performance).
      2. Balance Check: Is the student balancing academics and activities well?
      3. Suggestions: Constructive steps for the teacher/parent to support the student.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Gemini Factor Analysis Error", error);
    return "Could not perform factor analysis. Please check API key configuration.";
  }
};
