-- Replace the value below with a real auth.users.id from your Supabase project before running this optional demo seed.
do $$
declare
  demo_user uuid := '00000000-0000-0000-0000-000000000000';
  company uuid;
  c1 uuid;
  c2 uuid;
  c3 uuid;
  p1 uuid;
  p2 uuid;
  p3 uuid;
begin
  if demo_user = '00000000-0000-0000-0000-000000000000' then
    raise notice 'Set demo_user to an auth user id before running demo data.';
    return;
  end if;

  insert into company_profile (owner_user_id, name, address, city, state, pincode, gstin, email, phone, bank_name, bank_account, ifsc, upi_id)
  values (demo_user, 'DataBox2 Systems Pvt Ltd', '404, Neelkanth Business Park, Vidyavihar West', 'Mumbai', 'Maharashtra', '400086', '27AAGCD1234F1Z5', 'accounts@databox2.in', '+91 98765 43210', 'HDFC Bank', '50200012345678', 'HDFC0001234', 'databox2@hdfcbank')
  on conflict (owner_user_id) do update set name = excluded.name
  returning id into company;

  insert into app_settings (company_id, reminder_days_before, emi_interest_rate, pay_later_penalty_rate, low_stock_threshold)
  values (company, 3, 1.5, 2.0, 5)
  on conflict (company_id) do nothing;

  insert into customers (company_id, name, address, city, state, pincode, gstin, email, phone, loyalty_score) values
  (company, 'Aarav Retail Mart', '18 MG Road, Camp', 'Pune', 'Maharashtra', '411001', '27AAEFA1122B1Z8', 'billing@aaravretail.in', '+91 98220 11223', 4)
  returning id into c1;
  insert into customers (company_id, name, address, city, state, pincode, gstin, email, phone, loyalty_score) values
  (company, 'Kaveri Office Supplies', '42 Residency Road', 'Bengaluru', 'Karnataka', '560025', '29AAHCK9988L1Z2', 'accounts@kaverioffice.in', '+91 99008 44110', 2)
  returning id into c2;
  insert into customers (company_id, name, address, city, state, pincode, gstin, email, phone, loyalty_score) values
  (company, 'Shree Balaji Traders', 'Shop 12, Sadar Bazaar', 'Jaipur', 'Rajasthan', '302001', '08ABMFS3321Q1Z9', 'owner@balajitraders.in', '+91 94140 77880', 1)
  returning id into c3;

  insert into products (company_id, pid, hsn_code, name, description, upgrades, cost_price, profit_margin, gst_percent, stock_total, stock_unbooked, stock_not_shipped) values
  (company, 'DBX-LTP-14', '8471', '14 inch business laptop', 'Ryzen 5, 16 GB RAM, 512 GB SSD', '3 year onsite warranty', 42000, 9000, 18, 20, 14, 2) returning id into p1;
  insert into products (company_id, pid, hsn_code, name, description, upgrades, cost_price, profit_margin, gst_percent, stock_total, stock_unbooked, stock_not_shipped) values
  (company, 'DBX-UPS-1K', '8504', '1 KVA UPS', 'Line interactive UPS for office systems', 'Extra battery pack ready', 6200, 1800, 18, 35, 28, 4) returning id into p2;
  insert into products (company_id, pid, hsn_code, name, description, upgrades, cost_price, profit_margin, gst_percent, stock_total, stock_unbooked, stock_not_shipped) values
  (company, 'DBX-PRN-MF', '8443', 'Multifunction laser printer', 'Duplex print, scan and copy', 'Starter toner included', 14500, 3500, 18, 12, 9, 1) returning id into p3;
  insert into products (company_id, pid, hsn_code, name, description, cost_price, profit_margin, gst_percent, stock_total, stock_unbooked, stock_not_shipped) values
  (company, 'DBX-CBL-C6', '8544', 'Cat6 network cable box', '305 metre copper cable', 3200, 1200, 18, 50, 44, 0),
  (company, 'DBX-SVC-AMC', '9987', 'Annual maintenance service', 'Business IT support AMC', 18000, 12000, 18, 100, 100, 0);

  insert into invoices (company_id, invoice_number, customer_id, billing_date, credit_days, payment_type, payment_done, freight_charges, other_charges, round_off, subtotal, tax_total, final_total, payment_notes, is_delivered, status)
  values (company, '0001/2026', c1, current_date - interval '12 days', 7, 'spot', true, 500, 0, 0, 116000, 20880, 137380, 'Paid by NEFT', true, 'paid');
  insert into invoice_items (company_id, invoice_id, product_id, pid, hsn_code, name, description, upgrades, cost_price, profit_margin, discount_percent, quantity, marked_price, gst_percent, unit_price, total_price, tax_amount)
  select company, id, p1, 'DBX-LTP-14', '8471', '14 inch business laptop', 'Ryzen 5, 16 GB RAM, 512 GB SSD', '3 year onsite warranty', 42000, 9000, 0, 2, 51000, 18, 51000, 102000, 18360 from invoices where company_id = company and invoice_number = '0001/2026';
  insert into payment_history (company_id, invoice_id, amount_paid, payment_date, note, payment_mode)
  select company, id, 137380, current_date - interval '5 days', 'Full payment received', 'NEFT' from invoices where company_id = company and invoice_number = '0001/2026';

  insert into invoices (company_id, invoice_number, customer_id, billing_date, credit_days, payment_type, payment_done, freight_charges, other_charges, round_off, subtotal, tax_total, final_total, payment_notes, is_delivered, status)
  values (company, '0002/2026', c2, current_date - interval '25 days', 10, 'pay_later', false, 750, 250, 0, 52000, 9360, 62360, 'Awaiting customer approval', true, 'overdue');
  insert into invoice_items (company_id, invoice_id, product_id, pid, hsn_code, name, description, upgrades, cost_price, profit_margin, discount_percent, quantity, marked_price, gst_percent, unit_price, total_price, tax_amount)
  select company, id, p2, 'DBX-UPS-1K', '8504', '1 KVA UPS', 'Line interactive UPS for office systems', 'Extra battery pack ready', 6200, 1800, 0, 4, 8000, 18, 8000, 32000, 5760 from invoices where company_id = company and invoice_number = '0002/2026';
end $$;
