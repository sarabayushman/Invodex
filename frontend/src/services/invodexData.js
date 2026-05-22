import { supabase } from "../supabaseClient";

export async function bootstrapWorkspace(user, businessName) {
  const { data: orgId, error: orgError } = await supabase.rpc("ensure_default_org", {
    business_name: businessName || user?.user_metadata?.full_name || user?.email || null,
  });

  if (orgError) return { orgId: null, error: orgError };

  const { data: organization, error: fetchError } = await supabase
    .from("organizations")
    .select("*, organization_members(role, status, user_id)")
    .eq("id", orgId)
    .single();

  return { orgId, organization, error: fetchError };
}

export async function fetchInvoiceWorkspace(orgId) {
  const [invoices, products, customers, members] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, customers(*), invoice_items(*), payment_logs(*)")
      .eq("org_id", orgId)
      .order("billing_date", { ascending: false }),
    supabase.from("products").select("*").eq("org_id", orgId).order("name"),
    supabase.from("customers").select("*").eq("org_id", orgId).order("name"),
    supabase
      .from("organization_members")
      .select("*, profiles(email, full_name, avatar_url)")
      .eq("org_id", orgId)
      .order("created_at"),
  ]);

  const error = invoices.error || products.error || customers.error || members.error;
  return {
    data: {
      invoices: invoices.data || [],
      products: products.data || [],
      customers: customers.data || [],
      members: members.data || [],
    },
    error,
  };
}

export function mapCustomerFromDb(customer) {
  if (!customer) return null;
  return {
    id: customer.id,
    name: customer.name || "Unknown customer",
    contact: customer.contact_name || "",
    address: customer.address || "",
    gstin: customer.gstin || "",
    email: customer.email || "",
    phone: customer.phone || "",
    notes: customer.notes || "",
  };
}

export function mapProductFromDb(product) {
  if (!product) return null;
  return {
    id: product.id,
    pid: product.sku || "",
    hsn: product.hsn || "",
    name: product.name || "Untitled product",
    desc: product.description || "",
    cost: Number(product.cost_price || 0),
    margin: product.margin || "",
    shownDiscount: Number(product.shown_discount || 0),
    unit: Number(product.unit_price || 0),
    extraDiscount: Number(product.extra_discount || 0),
    qty: Number(product.quantity ?? product.inventory_qty ?? 1),
    gst: Number(product.gst_rate || 18),
  };
}

export function mapProductCategoryFromDb(category) {
  if (!category) return null;
  const items = (category.product_category_items || [])
    .slice()
    .sort((first, second) => Number(first.sort_order || 0) - Number(second.sort_order || 0))
    .map((item) => mapProductFromDb(item.products))
    .filter(Boolean);

  return {
    id: category.id,
    title: category.title || "Untitled category",
    description: category.description || "",
    products: items,
  };
}

export function mapInvoiceFromDb(invoice) {
  const payment = normalizePayment(invoice.payment, invoice.billing_date, invoice.delivered);
  const products = (invoice.invoice_items || [])
    .slice()
    .sort((first, second) => Number(first.sort_order || 0) - Number(second.sort_order || 0))
    .map((item) => ({
      id: item.product_id || item.id,
      itemId: item.id,
      pid: item.sku || "",
      hsn: item.hsn || "",
      name: item.name || "Untitled product",
      desc: item.description || "",
      cost: Number(item.cost_price || 0),
      margin: item.snapshot?.margin || "",
      shownDiscount: Number(item.shown_discount || 0),
      unit: Number(item.unit_price || 0),
      extraDiscount: Number(item.extra_discount || 0),
      qty: Number(item.quantity || 1),
      gst: Number(item.gst_rate || 18),
    }));

  const customerInfo = mapCustomerFromDb(invoice.customers) || {
    name: "Unknown customer",
    contact: "",
    address: "",
    gstin: "",
    email: "",
    phone: "",
  };

  return {
    dbId: invoice.id,
    id: invoice.invoice_number,
    customer: customerInfo.name,
    total: Number(invoice.totals?.finalTotal || 0),
    status: invoice.status || "Pending Payment",
    days: getDaysUntilDueDate(payment),
    billingDate: invoice.billing_date,
    customerInfo,
    products,
    note: invoice.note || "",
    delivered: Boolean(invoice.delivered),
    payment,
  };
}

export async function upsertCustomer(orgId, customer) {
  return supabase
    .from("customers")
    .upsert(
      {
        id: asUuid(customer.id),
        org_id: orgId,
        name: customer.name || "Unknown customer",
        contact_name: customer.contact || customer.contact_name || null,
        address: customer.address || null,
        gstin: customer.gstin || null,
        email: customer.email || null,
        phone: customer.phone || null,
        notes: customer.notes || null,
      },
      { onConflict: "id" },
    )
    .select()
    .single();
}

export async function deleteCustomerRecord(customerId) {
  return supabase.from("customers").delete().eq("id", customerId);
}

export async function upsertProduct(orgId, product) {
  return supabase
    .from("products")
    .upsert(
      {
        id: asUuid(product.id),
        org_id: orgId,
        sku: product.pid || product.sku || null,
        hsn: product.hsn || null,
        name: product.name || "Untitled product",
        description: product.desc || product.description || null,
        cost_price: Number(product.cost ?? product.cost_price ?? 0),
        unit_price: Number(product.unit ?? product.unit_price ?? 0),
        shown_discount: Number(product.shownDiscount ?? product.shown_discount ?? 0),
        extra_discount: Number(product.extraDiscount ?? product.extra_discount ?? 0),
        gst_rate: Number(product.gst ?? product.gst_rate ?? 18),
        inventory_qty: Number(product.inventoryQty ?? product.inventory_qty ?? product.qty ?? 0),
        margin: product.margin || null,
      },
      { onConflict: "id" },
    )
    .select()
    .single();
}

export async function fetchProductCategories(orgId) {
  return supabase
    .from("product_categories")
    .select("*, product_category_items(id, product_id, sort_order, products(*))")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
}

export async function upsertProductCategory(orgId, category) {
  return supabase
    .from("product_categories")
    .upsert(
      {
        id: asUuid(category.id),
        org_id: orgId,
        title: category.title || "Untitled category",
        description: category.description || "",
      },
      { onConflict: "id" },
    )
    .select()
    .single();
}

export async function saveProductToCategory(orgId, categoryId, product) {
  const productResult = await upsertProduct(orgId, product);
  if (productResult.error) return productResult;

  const itemResult = await supabase
    .from("product_category_items")
    .upsert(
      {
        org_id: orgId,
        category_id: categoryId,
        product_id: productResult.data.id,
      },
      { onConflict: "category_id,product_id" },
    )
    .select()
    .single();

  if (itemResult.error) return itemResult;
  return { data: productResult.data, error: null };
}

export async function upsertInvoice(orgId, invoice, totals) {
  return supabase
    .from("invoices")
    .upsert(
      {
        id: asUuid(invoice.dbId),
        org_id: orgId,
        customer_id: asUuid(invoice.customerInfo?.id || invoice.customer_id),
        invoice_number: invoice.invoice_number || invoice.id,
        status: invoice.status || "Pending Payment",
        billing_date: invoice.payment?.billingDate || invoice.billingDate,
        delivered: Boolean(invoice.delivered),
        note: invoice.note || "",
        payment: invoice.payment || {},
        totals: totals || {},
      },
      { onConflict: "id" },
    )
    .select()
    .single();
}

export async function replaceInvoiceItems(orgId, invoiceId, products) {
  const deleteResult = await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);
  if (deleteResult.error) return deleteResult;

  if (!products?.length) return { data: [], error: null };

  return supabase.from("invoice_items").insert(
    products.map((product, index) => ({
      org_id: orgId,
      invoice_id: invoiceId,
      product_id: asUuid(product.id || product.product_id),
      sku: product.pid || product.sku || null,
      hsn: product.hsn || null,
      name: product.name || "Untitled product",
      description: product.desc || product.description || null,
      cost_price: Number(product.cost ?? product.cost_price ?? 0),
      unit_price: Number(product.unit ?? product.unit_price ?? 0),
      shown_discount: Number(product.shownDiscount ?? product.shown_discount ?? 0),
      extra_discount: Number(product.extraDiscount ?? product.extra_discount ?? 0),
      gst_rate: Number(product.gst ?? product.gst_rate ?? 18),
      quantity: Number(product.qty ?? product.quantity ?? 1),
      sort_order: index,
      snapshot: product,
    })),
  );
}

export async function saveInvoiceWithItems(orgId, invoice, totals) {
  const invoiceResult = await upsertInvoice(orgId, invoice, totals);
  if (invoiceResult.error) return invoiceResult;

  const itemsResult = await replaceInvoiceItems(orgId, invoiceResult.data.id, invoice.products || []);
  if (itemsResult.error) return itemsResult;

  return { data: invoiceResult.data, error: null };
}

export async function deleteInvoiceRecord(invoiceDbId) {
  return supabase.from("invoices").delete().eq("id", invoiceDbId);
}

export function createAutosaveQueue(saveFn, delay = 650) {
  let timer = null;
  let latestPayload = null;

  return {
    schedule(payload) {
      latestPayload = payload;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        saveFn(latestPayload);
        latestPayload = null;
      }, delay);
    },
    flush() {
      window.clearTimeout(timer);
      if (latestPayload) saveFn(latestPayload);
      latestPayload = null;
    },
  };
}

function asUuid(value) {
  if (!value) return undefined;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value) ? value : undefined;
}

function normalizePayment(payment, billingDate, delivered = false) {
  return {
    type: payment?.type || "Spot",
    billingDate: payment?.billingDate || billingDate || new Date().toISOString().slice(0, 10),
    creditDays: Number(payment?.creditDays || 0),
    emiMonths: Number(payment?.emiMonths || 6),
    interestRate: Number(payment?.interestRate || 12),
    paid: Boolean(payment?.paid),
    nextEmiDueDate: payment?.nextEmiDueDate || null,
    closingDate: payment?.closingDate || null,
    logs: Array.isArray(payment?.logs) ? payment.logs : [],
    freightCharges: Number(payment?.freightCharges || 0),
    otherCharges: Array.isArray(payment?.otherCharges) ? payment.otherCharges : [],
    deliveryStage: payment?.deliveryStage || (delivered ? "delivered" : "draft"),
  };
}

function getDaysUntilDueDate(payment) {
  const billingDate = payment.billingDate || new Date().toISOString().slice(0, 10);
  const dueDate = payment.type === "Pay Later" ? addDays(billingDate, Number(payment.creditDays || 0)) : billingDate;
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`);
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.ceil((due - today) / 86400000);
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
