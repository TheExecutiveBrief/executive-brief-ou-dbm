revoke execute on function public.current_user_role() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_chief_editor() from public, anon;
revoke execute on function public.is_editorial_editor() from public, anon;
revoke execute on function public.is_section_writer() from public, anon;
revoke execute on function public.is_editor() from public, anon;
revoke execute on function public.is_editorial_member() from public, anon;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_chief_editor() to authenticated;
grant execute on function public.is_editorial_editor() to authenticated;
grant execute on function public.is_section_writer() to authenticated;
grant execute on function public.is_editor() to authenticated;
grant execute on function public.is_editorial_member() to authenticated;

revoke execute on function public.prevent_workflow_audit_tampering() from public, anon, authenticated;
revoke execute on function public.process_and_validate_workflow_audit() from public, anon, authenticated;
revoke execute on function public.validate_article_workflow_insert() from public, anon, authenticated;
revoke execute on function public.validate_article_workflow_update() from public, anon, authenticated;
revoke execute on function public.validate_editorial_profile_update() from public, anon, authenticated;
revoke execute on function public.validate_editorial_profile_insert() from public, anon, authenticated;