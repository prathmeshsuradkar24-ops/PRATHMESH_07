import os
from app.database.database import create_user


try:
    result = create_user(
        user_id="user123",
        username="admin",
        password=os.environ["TEST_ADMIN_PASSWORD"],
        role="admin"
    )

    if result:
        print("Test user created successfully.")

except Exception as error:
    print("Unable to create test user.")
    print("Reason:", error)