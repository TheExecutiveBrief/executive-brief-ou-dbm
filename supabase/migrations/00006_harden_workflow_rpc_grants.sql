-- Remove Supabase's default anonymous function grant from the workflow RPC.
-- The function also validates auth.uid(), but anonymous callers should not be
-- able to invoke the endpoint at all.
revoke execute on function public.submit_article_workflow_transition(uuid, text, text, text)
  from public, anon;

grant execute on function public.submit_article_workflow_transition(uuid, text, text, text)
  to authenticated;