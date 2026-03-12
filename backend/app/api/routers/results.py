from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.quiz import Quiz
from app.models.user import User
from app.services.quiz_service import QuizService
from app.services.report_service import ReportService

router = APIRouter(tags=["results"])


@router.get("/results/{quiz_id}")
async def get_results(
    quiz_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id, Quiz.user_id == user.id))
    quiz = result.scalar_one_or_none()
    if not quiz or not quiz.is_submitted:
        raise HTTPException(status_code=404, detail="Result not found")

    service = QuizService()
    return await service.get_result_payload(db=db, quiz=quiz)


@router.get("/results/{quiz_id}/export")
async def export_result(
    quiz_id: str,
    format: str = Query(default="pdf", pattern="^(pdf|csv)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id, Quiz.user_id == user.id))
    quiz = result.scalar_one_or_none()
    if not quiz or not quiz.is_submitted:
        raise HTTPException(status_code=404, detail="Result not found")

    service = QuizService()
    report_payload = await service.get_result_payload(db=db, quiz=quiz)
    reporter = ReportService()

    if format == "csv":
        csv_data = reporter.generate_csv(report_payload)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=quiz-{quiz_id}.csv"},
        )

    pdf_data = reporter.generate_pdf(report_payload)
    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=quiz-{quiz_id}.pdf"},
    )
