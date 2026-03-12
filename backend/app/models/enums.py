import enum


class UserRole(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"


class DifficultyLevel(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
