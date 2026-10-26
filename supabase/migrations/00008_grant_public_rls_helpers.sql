-- Public SELECT policies evaluate these helpers for anon requests. Their
-- SECURITY DEFINER implementations return false/null when auth.uid() is null.
grant execute on function public.current_user_role() to anon;
grant execute on function public.is_admin() to anon;
grant execute on function public.is_chief_editor() to anon;
grant execute on function public.is_editorial_editor() to anon;
grant execute on function public.is_section_writer() to anon;
grant execute on function public.is_editor() to anon;
grant execute on function public.is_editorial_member() to anon;