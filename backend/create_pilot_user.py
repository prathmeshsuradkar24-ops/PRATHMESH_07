import os
from app.database.database import create_user

try:
    create_user(
        user_id="pilot001",
        username="pilot1",
        password=os.environ["TEST_PILOT_PASSWORD"],
        role="pilot"
    )

    print("Pilot user created successfully.")

except Exception as error:
    print("Error creating pilot user:", error)