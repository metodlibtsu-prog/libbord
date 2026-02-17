-- Fix sentiment values for existing reviews based on their ratings
-- This aligns old reviews with the new automated sentiment logic

-- Set negative sentiment for ratings 1-2
UPDATE reviews
SET sentiment = 'negative'
WHERE rating IN (1, 2) AND sentiment != 'negative';

-- Set neutral sentiment for rating 3
UPDATE reviews
SET sentiment = 'neutral'
WHERE rating = 3 AND sentiment != 'neutral';

-- Set positive sentiment for ratings 4-5
UPDATE reviews
SET sentiment = 'positive'
WHERE rating IN (4, 5) AND sentiment != 'positive';
