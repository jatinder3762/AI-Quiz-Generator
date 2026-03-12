import asyncio
import sys

from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.enums import UserRole
from app.models.user import User

TEST_USERS = [
    {
        "email": "test.user@aiquiz.local",
        "full_name": "Test Student",
        "password": "TestUser@123",
        "role": UserRole.STUDENT,
    },
    {
        "email": "test.admin@aiquiz.local",
        "full_name": "Test Admin",
        "password": "TestAdmin@123",
        "role": UserRole.ADMIN,
    },
]


async def seed_test_users() -> None:
    async with SessionLocal() as session:
        for item in TEST_USERS:
            result = await session.execute(select(User).where(User.email == item["email"]))
            user = result.scalar_one_or_none()

            hashed_password = get_password_hash(item["password"])
            if user is None:
                session.add(
                    User(
                        email=item["email"],
                        full_name=item["full_name"],
                        hashed_password=hashed_password,
                        role=item["role"],
                    )
                )
            else:
                user.full_name = item["full_name"]
                user.hashed_password = hashed_password
                user.role = item["role"]

        await session.commit()

    print("Seeded test users successfully.")
    print("- Student: test.user@aiquiz.local / TestUser@123")
    print("- Admin:   test.admin@aiquiz.local / TestAdmin@123")


if __name__ == "__main__":
    try:
        asyncio.run(seed_test_users())
    except Exception as exc:
        print("Failed to seed test users.")
        print("Check that PostgreSQL is running and DATABASE_URL is correct in backend/.env.")
        print(f"Error: {exc}")
        sys.exit(1)
