#!/usr/bin/env python3
"""
Fix sentiment values for existing reviews based on their ratings.
This aligns old reviews with the new automated sentiment logic:
- Ratings 1-2 → negative
- Rating 3 → neutral
- Ratings 4-5 → positive
"""

import asyncio
from sqlalchemy import text
from app.database import engine


async def fix_sentiments():
    async with engine.begin() as conn:
        # Update negative sentiment (ratings 1-2)
        result1 = await conn.execute(
            text("""
                UPDATE reviews
                SET sentiment = 'negative'
                WHERE rating IN (1, 2) AND sentiment != 'negative'
            """)
        )
        print(f"[OK] Updated {result1.rowcount} reviews to negative sentiment")

        # Update neutral sentiment (rating 3)
        result2 = await conn.execute(
            text("""
                UPDATE reviews
                SET sentiment = 'neutral'
                WHERE rating = 3 AND sentiment != 'neutral'
            """)
        )
        print(f"[OK] Updated {result2.rowcount} reviews to neutral sentiment")

        # Update positive sentiment (ratings 4-5)
        result3 = await conn.execute(
            text("""
                UPDATE reviews
                SET sentiment = 'positive'
                WHERE rating IN (4, 5) AND sentiment != 'positive'
            """)
        )
        print(f"[OK] Updated {result3.rowcount} reviews to positive sentiment")

        total = result1.rowcount + result2.rowcount + result3.rowcount
        print(f"\nTotal reviews updated: {total}")

    await engine.dispose()


if __name__ == "__main__":
    print("Fixing review sentiments based on ratings...\n")
    asyncio.run(fix_sentiments())
    print("\nDone!")
