export function calculateItem(item) {
  const cost = Number(item.cost_price || 0);
  const profit = Number(item.profit_margin || 0);
  const discount = Number(item.discount_percent || 0);
  const quantity = Number(item.quantity || 1);
  const gst = Number(item.gst_percent || 0);
  const marked_price = cost + profit;
  const unit_price = marked_price * (1 - discount / 100);
  const total_price = unit_price * quantity;
  const tax_amount = total_price * gst / 100;
  return { ...item, marked_price, unit_price, total_price, tax_amount };
}

export function calculateInvoice(items = [], freight = 0, other = 0) {
  const calculated = items.map(calculateItem);
  const subtotal = calculated.reduce((sum, item) => sum + item.total_price, 0);
  const tax_total = calculated.reduce((sum, item) => sum + item.tax_amount, 0);
  const gross = subtotal + tax_total + Number(freight || 0) + Number(other || 0);
  const final_total = Math.round(gross);
  return { items: calculated, subtotal, tax_total, round_off: final_total - gross, final_total };
}
