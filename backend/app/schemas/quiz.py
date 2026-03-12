from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import DifficultyLevel


class GenerateQuizRequest(BaseModel):
    document_id: str
    num_questions: int = Field(ge=1, le=30)
    difficulty: DifficultyLevel


class QuestionPayload(BaseModel):
    id: str
    prompt: str
    options: dict[str, str]


class QuizResponse(BaseModel):
    id: str
    title: str
    difficulty: DifficultyLevel
    num_questions: int
    created_at: datetime
    questions: list[QuestionPayload]


class QuizSummary(BaseModel):
    id: str
    title: str
    difficulty: DifficultyLevel
    num_questions: int
    is_submitted: bool
    score_percentage: int | None = None
    created_at: datetime


class QuizListResponse(BaseModel):
    items: list[QuizSummary]


class SubmitAnswerItem(BaseModel):
    question_id: str
    selected_answer: str = Field(pattern="^[A-D]$")


class SubmitQuizRequest(BaseModel):
    quiz_id: str
    answers: list[SubmitAnswerItem]


class AnswerReview(BaseModel):
    question_id: str
    prompt: str
    selected_answer: str
    correct_answer: str
    explanation: str
    is_correct: bool


class QuizResultResponse(BaseModel):
    quiz_id: str
    score: int
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    score_percentage: int
    reviews: list[AnswerReview]
