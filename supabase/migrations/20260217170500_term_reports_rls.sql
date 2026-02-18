-- Enable RLS and add policies for term_reports
ALTER TABLE IF EXISTS term_reports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated teachers or admins to INSERT (create initial report)
CREATE POLICY term_reports_insert_role ON term_reports
  FOR INSERT
  TO public
  USING ( (
    has_role('teacher', auth.uid()) OR has_role('admin', auth.uid())
  ) )
  WITH CHECK ( (
    has_role('teacher', auth.uid()) OR has_role('admin', auth.uid())
  ) );

-- Allow SELECT for authenticated users (teachers/admins)
CREATE POLICY term_reports_select_auth ON term_reports
  FOR SELECT
  TO public
  USING ( (
    auth.uid() IS NOT NULL
  ) );

-- Allow teachers to UPDATE teacher_* fields but not modify head_* fields
CREATE POLICY term_reports_update_teacher ON term_reports
  FOR UPDATE
  TO public
  USING ( has_role('teacher', auth.uid()) )
  WITH CHECK ( (
    -- ensure head fields are unchanged by teacher updates
    (SELECT head_remark FROM term_reports WHERE id = NEW.id) IS NOT DISTINCT FROM NEW.head_remark
    AND (SELECT head_signed_by FROM term_reports WHERE id = NEW.id) IS NOT DISTINCT FROM NEW.head_signed_by
    AND (SELECT head_signature_url FROM term_reports WHERE id = NEW.id) IS NOT DISTINCT FROM NEW.head_signature_url
  ) );

-- Allow admins to UPDATE head_* fields but not modify teacher_* fields
CREATE POLICY term_reports_update_head ON term_reports
  FOR UPDATE
  TO public
  USING ( has_role('admin', auth.uid()) )
  WITH CHECK ( (
    -- ensure teacher fields are unchanged by head updates
    (SELECT teacher_remark FROM term_reports WHERE id = NEW.id) IS NOT DISTINCT FROM NEW.teacher_remark
    AND (SELECT teacher_signed_by FROM term_reports WHERE id = NEW.id) IS NOT DISTINCT FROM NEW.teacher_signed_by
    AND (SELECT teacher_signature_url FROM term_reports WHERE id = NEW.id) IS NOT DISTINCT FROM NEW.teacher_signature_url
  ) );

-- For safety, deny updates by others
-- (Not strictly necessary because no UPDATE policy exists for others)
