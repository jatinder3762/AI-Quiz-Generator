from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.models.quiz import Question, Quiz, QuizResult, UserAnswer
from app.models.user import User
from app.schemas.quiz import AnswerReview, QuizResultResponse
from app.services.llm import get_llm_provider
from app.services.vector_store import VectorStoreService


class QuizService:
    def __init__(self) -> None:
        self.llm = get_llm_provider()
        self.vector = VectorStoreService()

    async def generate_quiz(
        self,
        db: AsyncSession,
        user: User,
        document_id: str,
        num_questions: int,
        difficulty: str,
    ) -> Quiz:
        result = await db.execute(
            select(Document).where(Document.id == document_id, Document.user_id == user.id)
        )
        document = result.scalar_one_or_none()
        if not document:
            raise ValueError("Document not found")

        context = "\n\n".join(self.vector.search_chunks(document_id=document_id, query="important concepts"))
        items = self.llm.generate_mcq(context=context, num_questions=num_questions, difficulty=difficulty)

        quiz = Quiz(
            user_id=user.id,
            document_id=document_id,
            title=f"{document.filename} Quiz",
            difficulty=difficulty,
            num_questions=num_questions,
        )
        db.add(quiz)
        await db.flush()

        for item in items:
            db.add(
                Question(
                    quiz_id=quiz.id,
                    prompt=item["prompt"],
                    options=item["options"],
                    correct_answer=item["correct_answer"],
                    explanation=item["explanation"],
                )
            )

        await db.commit()
        await db.refresh(quiz)
        return quiz

    async def submit_quiz(
        self,
        db: AsyncSession,
        quiz: Quiz,
        answers: list[dict[str, str]],
    ) -> QuizResultResponse:
        if quiz.is_submitted:
            return await self.get_result_payload(db=db, quiz=quiz)

        await db.refresh(quiz, ["questions"])
        question_map = {q.id: q for q in quiz.questions}

        reviews: list[AnswerReview] = []
        correct = 0

        for item in answers:
            question = question_map.get(item["question_id"])
            if not question:
                continue
            is_correct = question.correct_answer == item["selected_answer"]
            if is_correct:
                correct += 1

            db.add(
                UserAnswer(
                    quiz_id=quiz.id,
                    question_id=question.id,
                    selected_answer=item["selected_answer"],
                    is_correct=is_correct,
                )
            )

            reviews.append(
                AnswerReview(
                    question_id=question.id,
                    prompt=question.prompt,
                    selected_answer=item["selected_answer"],
                    correct_answer=question.correct_answer,
                    explanation=question.explanation,
                    is_correct=is_correct,
                )
            )

        total = len(quiz.questions)
        incorrect = total - correct
        percentage = int((correct / total) * 100) if total else 0

        result = QuizResult(
            quiz_id=quiz.id,
            score=correct,
            total_questions=total,
            correct_answers=correct,
            incorrect_answers=incorrect,
            score_percentage=percentage,
        )
        quiz.is_submitted = True
        db.add(result)
        await db.commit()

        return QuizResultResponse(
            quiz_id=quiz.id,
            score=correct,
            total_questions=total,
            correct_answers=correct,
            incorrect_answers=incorrect,
            score_percentage=percentage,
            reviews=reviews,
        )

    async def get_result_payload(self, db: AsyncSession, quiz: Quiz) -> QuizResultResponse:
        await db.refresh(quiz, ["questions", "result"])
        answers_result = await db.execute(select(UserAnswer).where(UserAnswer.quiz_id == quiz.id))
        answer_map = {a.question_id: a for a in answers_result.scalars().all()}

        reviews: list[AnswerReview] = []
        for question in quiz.questions:
            ans = answer_map.get(question.id)
            if not ans:
                continue
            reviews.append(
                AnswerReview(
                    question_id=question.id,
                    prompt=question.prompt,
                    selected_answer=ans.selected_answer,
                    correct_answer=question.correct_answer,
                    explanation=question.explanation,
                    is_correct=ans.is_correct,
                )
            )

        if not quiz.result:
            total = len(quiz.questions)
            correct = sum(1 for r in reviews if r.is_correct)
            incorrect = total - correct
            percentage = int((correct / total) * 100) if total else 0
            return QuizResultResponse(
                quiz_id=quiz.id,
                score=correct,
                total_questions=total,
                correct_answers=correct,
                incorrect_answers=incorrect,
                score_percentage=percentage,
                reviews=reviews,
            )

        return QuizResultResponse(
            quiz_id=quiz.id,
            score=quiz.result.score,
            total_questions=quiz.result.total_questions,
            correct_answers=quiz.result.correct_answers,
            incorrect_answers=quiz.result.incorrect_answers,
            score_percentage=quiz.result.score_percentage,
            reviews=reviews,
        )
