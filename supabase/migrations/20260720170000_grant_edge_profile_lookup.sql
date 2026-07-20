-- The account-lifecycle Edge boundary authorizes each operation from this
-- minimum profile projection before it invokes service-role-only RPCs.
grant select (
  id,
  email,
  position_code,
  is_admin,
  is_active,
  must_change_password
) on public.profiles to service_role;
