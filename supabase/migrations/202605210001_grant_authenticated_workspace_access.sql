grant usage on schema public to authenticated;

grant select, insert, update on public.profiles to authenticated;

grant select on public.organizations to authenticated;
grant update on public.organizations to authenticated;

grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.invoices to authenticated;
grant select, insert, update, delete on public.invoice_items to authenticated;
grant select, insert, update, delete on public.payment_logs to authenticated;

grant execute on function public.ensure_default_org(text) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
