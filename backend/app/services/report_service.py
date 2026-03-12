import csv
from io import BytesIO, StringIO

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.schemas.quiz import QuizResultResponse


class ReportService:
    def generate_csv(self, result: QuizResultResponse) -> str:
        buffer = StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["Question", "Selected", "Correct", "Explanation", "Is Correct"])
        for review in result.reviews:
            writer.writerow(
                [
                    review.prompt,
                    review.selected_answer,
                    review.correct_answer,
                    review.explanation,
                    review.is_correct,
                ]
            )
        writer.writerow([])
        writer.writerow(["Score", result.score])
        writer.writerow(["Percentage", result.score_percentage])
        return buffer.getvalue()

    def generate_pdf(self, result: QuizResultResponse) -> bytes:
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        y = 760
        pdf.drawString(50, y, f"Quiz Result: {result.quiz_id}")
        y -= 20
        pdf.drawString(50, y, f"Score: {result.score}/{result.total_questions} ({result.score_percentage}%)")
        y -= 30

        for idx, review in enumerate(result.reviews, start=1):
            lines = [
                f"{idx}. {review.prompt[:90]}",
                f"Selected: {review.selected_answer} | Correct: {review.correct_answer} | Match: {review.is_correct}",
                f"Explanation: {review.explanation[:110]}",
            ]
            for line in lines:
                pdf.drawString(50, y, line)
                y -= 15
                if y < 80:
                    pdf.showPage()
                    y = 760
            y -= 10

        pdf.save()
        return buffer.getvalue()
