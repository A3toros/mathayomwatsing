-- Add unique constraint to teacher_subjects table to support ON CONFLICT clause
-- This ensures that the same teacher cannot have duplicate subject-grade-class combinations

-- First, remove any existing duplicates (if any)
DELETE FROM teacher_subjects 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM teacher_subjects 
    GROUP BY teacher_id, subject_id, grade, class
);

-- Add the unique constraint
ALTER TABLE teacher_subjects 
ADD CONSTRAINT unique_teacher_subject_grade_class 
UNIQUE (teacher_id, subject_id, grade, class);

-- Create an index for better performance on lookups
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_unique_lookup 
ON teacher_subjects (teacher_id, subject_id, grade, class);
