/*
  # JWT Custom Claims Hook

  Embeds org_id and user_role in the JWT token at login time.
  This eliminates an extra DB query per request and makes the
  middleware able to trust the token without hitting the DB.

  Requirements (manual step in Supabase Dashboard):
    Authentication → Auth Hooks → Custom Access Token → set to
    public.custom_access_token_hook
*/

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims    jsonb;
  v_org_id  text;
  v_role    text;
BEGIN
  SELECT u.org_id::text, u.role::text
    INTO v_org_id, v_role
    FROM public.users u
   WHERE u.auth_user_id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF v_org_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{org_id}',    to_jsonb(v_org_id));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Only supabase_auth_admin may call this hook
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
