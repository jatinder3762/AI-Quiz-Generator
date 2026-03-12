from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.quiz import (
    GenerateQuizRequest,
    QuizListResponse,
    QuizResponse,
    QuizSummary,
    QuestionPayload,
    SubmitQuizRequest,
)
from app.services.quiz_service import QuizService
from app.utils.rate_limiter import InMemoryRateLimiter

router = APIRouter(tags=["quiz"])
quiz_rate_limiter = InMemoryRateLimiter(max_requests=10, window_minutes=1)


@router.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(
    payload: GenerateQuizRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> QuizResponse:
    if not quiz_rate_limiter.allow(user.id):
        raise HTTPException(status_code=429, detail="Too many quiz generation requests")

    service = QuizService()
    try:
        quiz = await service.generate_quiz(
            db=db,
            user=user,
            document_id=payload.document_id,
            num_questions=payload.num_questions,
            difficulty=payload.difficulty.value,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    await db.refresh(quiz, ["questions"])
    return QuizResponse(
        id=quiz.id,
        title=quiz.title,
        difficulty=quiz.difficulty,
        num_questions=quiz.num_questions,
        created_at=quiz.created_at,
        questions=[QuestionPayload(id=q.id, prompt=q.prompt, options=q.options) for q in quiz.questions],
    )


@router.get("/quiz/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> QuizResponse:
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id, Quiz.user_id == user.id))
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    await db.refresh(quiz, ["questions"])
    return QuizResponse(
        id=quiz.id,
        title=quiz.title,
        difficulty=quiz.difficulty,
        num_questions=quiz.num_questions,
        created_at=quiz.created_at,
        questions=[QuestionPayload(id=q.id, prompt=q.prompt, options=q.options) for q in quiz.questions],
    )


@router.post("/submit-quiz")
async def submit_quiz(
    payload: SubmitQuizRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Quiz).where(Quiz.id == payload.quiz_id, Quiz.user_id == user.id))
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    service = QuizService()
    return await service.submit_quiz(
        db=db,
        quiz=quiz,
        answers=[a.model_dump() for a in payload.answers],
    )


@router.get("/quizzes", response_model=QuizListResponse)
async def list_quizzes(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> QuizListResponse:
    result = await db.execute(select(Quiz).where(Quiz.user_id == user.id).order_by(Quiz.created_at.desc()))
    quizzes = result.scalars().all()

    items: list[QuizSummary] = []
    for q in quizzes:
        await db.refresh(q, ["result"])
        items.append(
            QuizSummary(
                id=q.id,
                title=q.title,
                difficulty=q.difficulty,
                num_questions=q.num_questions,
                is_submitted=q.is_submitted,
                score_percentage=q.result.score_percentage if q.result else None,
                created_at=q.created_at,
            )
        )

    return QuizListResponse(items=items)
