CREATE TYPE public.application_status AS ENUM ('submitted','under_review','approved','waitlisted','rejected');
CREATE TYPE public.consent_status AS ENUM ('pending','received','verified','rejected');
CREATE TYPE public.document_type AS ENUM ('load_slip','school_id','parental_consent');

CREATE TABLE public.application_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  opens_at timestamptz NOT NULL,
  closes_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  CHECK (closes_at > opens_at)
);
GRANT SELECT ON public.application_periods TO authenticated;
GRANT ALL ON public.application_periods TO service_role;
ALTER TABLE public.application_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read periods" ON public.application_periods FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.is_period_open(_period_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.application_periods WHERE id = _period_id AND is_active AND now() BETWEEN opens_at AND closes_at)
$$;
REVOKE EXECUTE ON FUNCTION public.is_period_open(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_period_open(uuid) TO authenticated, service_role;

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_id uuid NOT NULL REFERENCES public.application_periods(id),
  first_name text NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 80),
  middle_name text NOT NULL DEFAULT '' CHECK (char_length(middle_name) <= 80),
  last_name text NOT NULL CHECK (char_length(last_name) BETWEEN 1 AND 80),
  sex text NOT NULL CHECK (sex IN ('male','female')),
  birthdate date NOT NULL,
  contact_number text NOT NULL CHECK (char_length(contact_number) BETWEEN 7 AND 20),
  email text NOT NULL CHECK (char_length(email) <= 255),
  home_address text NOT NULL CHECK (char_length(home_address) BETWEEN 1 AND 300),
  municipality text NOT NULL CHECK (char_length(municipality) BETWEEN 1 AND 100),
  student_id text NOT NULL CHECK (char_length(student_id) BETWEEN 1 AND 40),
  college_program text NOT NULL CHECK (char_length(college_program) BETWEEN 1 AND 150),
  year_level text NOT NULL CHECK (char_length(year_level) BETWEEN 1 AND 20),
  guardian_name text NOT NULL CHECK (char_length(guardian_name) BETWEEN 1 AND 150),
  guardian_relationship text NOT NULL CHECK (char_length(guardian_relationship) BETWEEN 1 AND 60),
  guardian_contact text NOT NULL CHECK (char_length(guardian_contact) BETWEEN 7 AND 20),
  guardian_email text NOT NULL CHECK (char_length(guardian_email) <= 255),
  emergency_name text NOT NULL CHECK (char_length(emergency_name) BETWEEN 1 AND 150),
  emergency_relationship text NOT NULL CHECK (char_length(emergency_relationship) BETWEEN 1 AND 60),
  emergency_contact text NOT NULL CHECK (char_length(emergency_contact) BETWEEN 7 AND 20),
  preferred_building text CHECK (preferred_building IS NULL OR char_length(preferred_building) <= 150),
  status public.application_status NOT NULL DEFAULT 'submitted',
  consent_status public.consent_status NOT NULL DEFAULT 'pending',
  consent_rejection_reason text,
  original_consent_received boolean NOT NULL DEFAULT false,
  admin_remarks text,
  privacy_notice_version text NOT NULL,
  privacy_accepted_at timestamptz NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  UNIQUE (user_id, period_id)
);
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students create own application in open period" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_period_open(period_id));
CREATE POLICY "Read own application or admin" ON public.applications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Update own application or admin" ON public.applications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.protect_application_fields() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'submitted'; NEW.consent_status := 'pending'; NEW.consent_rejection_reason := NULL;
    NEW.original_consent_received := false; NEW.admin_remarks := NULL; NEW.reviewed_by := NULL; NEW.reviewed_at := NULL;
    NEW.submitted_at := now(); NEW.privacy_accepted_at := LEAST(NEW.privacy_accepted_at, now());
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.consent_status IS DISTINCT FROM OLD.consent_status
     OR NEW.consent_rejection_reason IS DISTINCT FROM OLD.consent_rejection_reason
     OR NEW.original_consent_received IS DISTINCT FROM OLD.original_consent_received
     OR NEW.admin_remarks IS DISTINCT FROM OLD.admin_remarks OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.period_id IS DISTINCT FROM OLD.period_id OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
     OR NEW.privacy_notice_version IS DISTINCT FROM OLD.privacy_notice_version
     OR NEW.privacy_accepted_at IS DISTINCT FROM OLD.privacy_accepted_at THEN
    RAISE EXCEPTION 'Students cannot change status or review fields';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_application_fields BEFORE INSERT OR UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.protect_application_fields();
REVOKE EXECUTE ON FUNCTION public.protect_application_fields() FROM PUBLIC, anon, authenticated;

CREATE TABLE public.application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  type public.document_type NOT NULL,
  storage_path text NOT NULL CHECK (char_length(storage_path) <= 500),
  file_name text NOT NULL CHECK (char_length(file_name) BETWEEN 1 AND 255),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.application_documents TO authenticated;
GRANT ALL ON public.application_documents TO service_role;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students add documents to own application" ON public.application_documents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid())
    AND split_part(storage_path,'/',1) = auth.uid()::text);
CREATE POLICY "Read own documents or admin" ON public.application_documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid()));

CREATE POLICY "Students upload own documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'application-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Students read own documents or admin" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'application-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));