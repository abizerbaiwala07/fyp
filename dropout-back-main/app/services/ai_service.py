import google.generativeai as genai
import asyncio
from app.config import settings
from app.models.student import Student
from typing import Optional
import json
import base64
import fitz # PyMuPDF for PDF extraction
import io

class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-flash-latest')
        else:
            self.model = None

    async def generate_advisor_report(self, student: Student) -> str:
        """
        Generate a personalized study analysis report using Gemini AI.
        """
        if not self.model:
            return self._generate_fallback_report(student)

        prompt = self._construct_prompt(student)
        
        try:
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            return response.text
        except Exception as e:
            print(f"AI Generation Error: {e}")
            return self._generate_fallback_report(student)

    async def generate_quiz_from_text(self, text: str, difficulty: str = "Medium", num_questions: int = 5) -> dict:
        """
        Parses raw textbook text and forces Gemini to output a strict structured JSON array of Quiz questions.
        Supports MCQs, True/False, and Short Answer questions.
        """
        if not self.model:
            raise Exception("Gemini AI is not configured. Missing API Key.")
            
        # We enforce a strict System Prompt with JSON structure instructions.
        prompt = f"""
You are an expert educational assessment creator.
Task: You have been provided raw text extracted from a student's study material. 
Objective: Generate a {difficulty} difficulty, {num_questions}-question quiz based specifically on the core facts in the text.

Provided Text Segment:
"{text[:10000]}"

Instructions:
1. Extract true core educational concepts, ignore document formatting artifacts.
2. Mix the following question types:
   - 'mcq': Multiple Choice (4 options, 1 correct)
   - 'true_false': True or False (2 options)
   - 'short_answer': A question requiring a specific conceptual answer (provide the expected answer in 'correctAnswer').
3. For 'mcq', provide exactly 4 options.
4. For 'true_false', options must be ["True", "False"].
5. Provide a brief but highly educational 'explanation' for why the correct answer is the right one.
6. Output NOTHING but valid JSON. Do not include markdown blocks like ```json or anything. Just raw JSON.

JSON Schema (Strictly follow this array structure!):
[
  {{
    "id": "q_1",
    "type": "mcq" | "true_false" | "short_answer",
    "question": "string",
    "options": ["string", "string", "string", "string"] (null for short_answer),
    "correctIndex": integer (0 to 3, null for short_answer),
    "correctAnswer": "string" (The textual correct answer, especially for short_answer),
    "explanation": "string"
  }}
]
"""
        try:
            # Tell Gemini to generate content
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            raw_text = response.text.strip()
            
            # Clean up potential markdown formatting
            if "```" in raw_text:
                # Extract content between triple backticks if present
                import re
                json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text)
                if json_match:
                    raw_text = json_match.group(1)
            
            return json.loads(raw_text.strip())
        except Exception as e:
            print(f"Quiz Generation Error: {e}")
            raise Exception("Failed to generate quiz from the provided document content. Ensure the content is readable.")

    def _construct_prompt(self, student: Student) -> str:
        # Map weak/strong subjects if they are in different fields
        weak_subs = getattr(student, 'weak_subjects', 'Mathematics, Physics')
        strong_subs = getattr(student, 'strong_subjects', 'Biology, English')
        
        prompt = f"""
You are an intelligent academic advisor AI. 
Based on the student's data below, generate a highly personalized and practical study analysis report.

Student Data:
- Name: {student.name}
- Age: {student.age}
- Study hours per week: {student.study_hours_per_week}
- Attendance: {student.attendance_rate}%
- Weak subjects: {weak_subs}
- Strong subjects: {strong_subs}
- Target exam: {student.target_exam if hasattr(student, 'target_exam') else 'N/A'}
- Academic Goal: {student.career_goal if hasattr(student, 'career_goal') else 'Engineering/Professional career'}

Your task is to generate the following sections in Markdown:

1. Areas for Improvement:
- Identify 2–4 realistic weaknesses (be specific and actionable)

2. Strengths:
- Highlight 3–4 strengths based on data

3. Personalized Study Plan:
- Focus Areas: 4 practical improvements
- Priority Subjects: Subjects needing most attention with topic-level suggestions

4. Action Plan:
- This Week: 3 short, achievable tasks
- Next 3 Months: 3 medium-term goals
- Long-term Vision: 3 big goals

Guidelines:
- Tone: Motivating but realistic
- Format: Clean Markdown with headers and bullet points
- Avoid generic advice.
- If specific data is missing, make reasonable inferences based on their "Science" or "Commerce" stream.
"""
        return prompt

    def _generate_fallback_report(self, student: Student) -> str:
        """Fallback rule-based report if AI is unavailable"""
        return f"""
### 🎓 Academic Advisor Report (Lite)
**Student Name:** {student.name}

*Note: Your full AI report is currently unavailable. Here are some quick suggestions:*

- **Strengths:** Your attendance ( {student.attendance_rate}% ) is excellent.
- **Improvement:** Focus on balancing your {student.study_hours_per_week} weekly study hours across all subjects.
- **Next Steps:** Review your weak subjects (Mathematics/Physics) for at least 1 hour daily.
"""

    async def generate_quiz_feedback(self, score_pct: float, subject: str, difficulty: str) -> str:
        """
        Generate brief, motivating AI feedback based on quiz performance.
        """
        if not self.model:
            return "Good job on completing the quiz! Keep practiced."

        prompt = f"""
You are an encouraging academic AI coach. 
Task: Provide a 1-2 sentence motivational and slightly technical feedback for a student who just finished a {difficulty} quiz on {subject}.
Result: The student scored {score_pct}%.

Guidelines:
- If score is high (>80%): Praise their mastery and suggest moving to 'Hard' or exploring advanced topics.
- If score is medium (50-80%): Give a balance of praise and specific areas to review.
- If score is low (<50%): Be very encouraging, suggest reviewing basics, and remind them that failure is part of learning.

Keep it short and punchy.
"""
        try:
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            return response.text.strip()
        except:
            return "Solid attempt! Review the explanations to strengthen your concept mastery."

    async def extract_report_card_data(self, file_content: bytes, file_type: str) -> dict:
        """
        Extract subject names and marks from a report card (Image or PDF) using Gemini.
        """
        if not self.model:
            raise Exception("Gemini AI is not configured. Missing API Key.")

        content_to_analyze = []
        
        if "image" in file_type:
            content_to_analyze.append({
                "mime_type": file_type,
                "data": file_content
            })
        elif "pdf" in file_type:
            try:
                import fitz
                pdf_stream = io.BytesIO(file_content)
                doc = fitz.open(stream=pdf_stream, filetype="pdf")
                extracted_text = ""
                for page in doc:
                    extracted_text += page.get_text()
                content_to_analyze.append(f"Extracted PDF Text Content:\n{extracted_text}")
            except Exception as e:
                print(f"PDF Extraction Error: {e}")
                raise Exception("Failed to read the PDF document.")

        prompt = """
You are an expert data extraction AI. Specialized in academic report cards and marksheets.
Task: Extract all subjects and their corresponding marks/scores from the provided document.

Instructions:
1. Identify the subject name and the numeric score.
2. If the score is out of 100, just provide the mark. 
3. If the score is a grade (A, B, C), try to map it to a representative percentage (A=90, B=80, C=70, etc.).
4. Ignore headers, student names, and non-subject rows.
5. If you find a date on the report card, extract it in YYYY-MM-DD format. Default to today's date if not found.
6. Output NOTHING but a valid JSON object.

JSON Schema:
{
  "date": "YYYY-MM-DD",
  "subjects": [
    { "name": "Subject Name", "score": integer }
  ]
}
"""

        try:
            final_content = [prompt] + content_to_analyze
            response = await asyncio.to_thread(self.model.generate_content, final_content)
            
            json_str = response.text.strip()
            if "```" in json_str:
                import re
                match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", json_str)
                if match: json_str = match.group(1)
            
            return json.loads(json_str)
        except Exception as e:
            print(f"AI Extraction Error: {e}")
            raise Exception("Failed to extract data from report card. Please ensure the file is clear.")

    async def verify_quest_proof(self, quest_title: str, quest_desc: str, submission_text: str = None, file_content: bytes = None, file_type: str = None) -> dict:
        """
        Verify quest proof using Gemini. Supports text, images, and PDFs.
        """
        if not self.model:
            return {"verified": True, "reason": "AI verification skipped (not configured)."}

        content_to_analyze = []
        
        if submission_text:
            content_to_analyze.append(f"Student Submission Text: {submission_text}")

        if file_content and file_type:
            if "image" in file_type:
                content_to_analyze.append({
                    "mime_type": file_type,
                    "data": file_content
                })
            elif "pdf" in file_type:
                try:
                    import fitz
                    pdf_stream = io.BytesIO(file_content)
                    doc = fitz.open(stream=pdf_stream, filetype="pdf")
                    extracted_text = ""
                    for page in doc:
                        extracted_text += page.get_text()
                    content_to_analyze.append(f"Extracted PDF Content:\n{extracted_text[:10000]}")
                except Exception as e:
                    print(f"PDF Extraction Error: {e}")
                    return {"verified": False, "reason": "Failed to read the PDF document."}

        prompt = f"""
You are an intelligent educational supervisor. Verify if a student has completed their daily quest based on the provided proof.
Quest Title: {quest_title}
Quest Goal: {quest_desc}

Output format (JSON ONLY):
{{
  "verified": boolean,
  "reason": "Short explanation"
}}
"""
        try:
            final_content = [prompt] + content_to_analyze
            response = await asyncio.to_thread(self.model.generate_content, final_content)
            
            json_str = response.text.strip()
            if "```" in json_str:
                import re
                match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", json_str)
                if match: json_str = match.group(1)
            
            return json.loads(json_str)
        except Exception as e:
            print(f"AI Verification Error: {e}")
            return {"verified": True, "reason": "Verification bypassed due to technical error."}

ai_service = AIService()
