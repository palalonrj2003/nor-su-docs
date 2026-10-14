CREATE OR REPLACE FUNCTION public.protect_application_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'submitted'; NEW.consent_status := 'pending'; NEW.consent_rejection_reason := NULL;
    NEW.original_consent_received := false; NEW.admin_remarks := NULL; NEW.reviewed_by := NULL; NEW.reviewed_at := NULL;
    NEW.submitted_at := now(); NEW.privacy_accepted_at := LEAST(NEW.privacy_accepted_at, now());
    RETURN NEW;
  END IF;
  -- Students may only move consent_status to 'received' (after uploading the notarized form).
  IF NEW.consent_status IS DISTINCT FROM OLD.consent_status THEN
    IF NEW.consent_status = 'received' AND OLD.consent_status IN ('pending','rejected') THEN
      NEW.consent_rejection_reason := NULL;
    ELSE
      RAISE EXCEPTION 'Students cannot change status or review fields';
    END IF;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
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
END
$$;