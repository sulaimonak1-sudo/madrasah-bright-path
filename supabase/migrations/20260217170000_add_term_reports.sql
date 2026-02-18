-- Create term_reports table to store teacher/head remarks and signatures
CREATE TABLE IF NOT EXISTS term_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id),
  term_id uuid REFERENCES terms(id),
  teacher_remark text,
  head_remark text,
  teacher_signed_by uuid,
  head_signed_by uuid,
  teacher_signed_at timestamptz,
  head_signed_at timestamptz,
  teacher_signature_url text,
  head_signature_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Function to set signed_at timestamps when signed_by is set
CREATE OR REPLACE FUNCTION set_term_reports_signed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.teacher_signed_by IS NOT NULL AND NEW.teacher_signed_at IS NULL THEN
      NEW.teacher_signed_at := now();
    END IF;
    IF NEW.head_signed_by IS NOT NULL AND NEW.head_signed_at IS NULL THEN
      NEW.head_signed_at := now();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.teacher_signed_by IS NOT NULL AND OLD.teacher_signed_by IS NULL THEN
      NEW.teacher_signed_at := now();
    END IF;
    IF NEW.head_signed_by IS NOT NULL AND OLD.head_signed_by IS NULL THEN
      NEW.head_signed_at := now();
    END IF;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_term_reports_signed_at
BEFORE INSERT OR UPDATE ON term_reports
FOR EACH ROW EXECUTE FUNCTION set_term_reports_signed_at();
