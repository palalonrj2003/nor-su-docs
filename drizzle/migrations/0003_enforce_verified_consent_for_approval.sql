CREATE OR REPLACE FUNCTION public.enforce_verified_consent_for_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.consent_status <> 'verified' THEN
    RAISE EXCEPTION 'An application can only be approved when consent is verified.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_verified_consent_for_approval() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_verified_consent_for_approval() TO service_role;

CREATE TRIGGER enforce_verified_consent_for_approval
BEFORE INSERT OR UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.enforce_verified_consent_for_approval();