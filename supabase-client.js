/* ============================================================
   Ash Procurement — Supabase client module
   ------------------------------------------------------------
   Drop this in alongside procurement-app.html (or paste into a
   <script> block before your app's own script) once you have:
     1. Created a Supabase project at supabase.com
     2. Run schema.sql in the SQL Editor
     3. Copied your Project URL + anon public key from
        Settings → API

   This module mirrors the shape the app already uses
   (getVendors/saveVendors/getStores/... etc.) but every function
   is now async and talks to Postgres instead of localStorage.
   See INTEGRATION.md for how to wire this into the existing file.
   ============================================================ */

const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';       // e.g. https://abcxyz.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';      // Settings → API → anon public

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---- helpers to convert between the app's camelCase objects and Postgres' snake_case columns ---- */
function vendorFromRow(r){ return { id:r.id, name:r.name, category:r.category, contact:r.contact, email:r.email, phone:r.phone, rating:Number(r.rating), status:r.status, totalSpend:Number(r.total_spend) }; }
function vendorToRow(v){ return { name:v.name, category:v.category, contact:v.contact, email:v.email, phone:v.phone, rating:v.rating, status:v.status, total_spend:v.totalSpend }; }

function storeFromRow(r){ return { id:r.id, name:r.name, address:r.address, contact:r.contact, phone:r.phone, status:r.status }; }
function storeToRow(s){ return { name:s.name, address:s.address, contact:s.contact, phone:s.phone, status:s.status }; }

function historyFromRow(r){ return { id:r.id, poNumber:r.po_number, vendor:r.vendor, store:r.store, item:r.item, department:r.department, amount:Number(r.amount), date:r.purchase_date, status:r.status }; }
function historyToRow(h){ return { po_number:h.poNumber, vendor:h.vendor, store:h.store, item:h.item, department:h.department, amount:h.amount, purchase_date:h.date, status:h.status }; }

function orderFromRow(r){ return { id:r.id, orderNumber:r.order_number, vendor:r.vendor, store:r.store, item:r.item, quantity:Number(r.quantity), amount:Number(r.amount), date:r.order_date, status:r.status, paymentStatus:r.payment_status, invoiceUrl:r.invoice_url, proofUrl:r.proof_url }; }
function orderToRow(o){ return { order_number:o.orderNumber, vendor:o.vendor, store:o.store, item:o.item, quantity:o.quantity, amount:o.amount, order_date:o.date, status:o.status, payment_status:o.paymentStatus, invoice_url:o.invoiceUrl || null, proof_url:o.proofUrl || null }; }

function consumableFromRow(r){ return { id:r.id, store:r.store, item:r.item, category:r.category, quantity:Number(r.quantity), unit:r.unit, reorderLevel:Number(r.reorder_level) }; }
function consumableToRow(c){ return { store:c.store, item:c.item, category:c.category, quantity:c.quantity, unit:c.unit, reorder_level:c.reorderLevel }; }

function checkError(error, action){
  if(error){ console.error(action, error); throw error; }
}

/* ---- VENDORS ---- */
async function getVendors(){
  const { data, error } = await supabase.from('vendors').select('*').order('created_at', { ascending:false });
  checkError(error, 'getVendors');
  return data.map(vendorFromRow);
}
async function addVendor(vendor){
  const { data, error } = await supabase.from('vendors').insert(vendorToRow(vendor)).select().single();
  checkError(error, 'addVendor');
  return vendorFromRow(data);
}
async function addVendorsBulk(vendorList){ // for Excel import
  const { data, error } = await supabase.from('vendors').insert(vendorList.map(vendorToRow)).select();
  checkError(error, 'addVendorsBulk');
  return data.map(vendorFromRow);
}
async function updateVendor(id, patch){
  const { data, error } = await supabase.from('vendors').update(vendorToRow(patch)).eq('id', id).select().single();
  checkError(error, 'updateVendor');
  return vendorFromRow(data);
}
async function deleteVendor(id){
  const { error } = await supabase.from('vendors').delete().eq('id', id);
  checkError(error, 'deleteVendor');
}

/* ---- STORES ---- */
async function getStores(){
  const { data, error } = await supabase.from('stores').select('*').order('created_at', { ascending:false });
  checkError(error, 'getStores');
  return data.map(storeFromRow);
}
async function addStore(store){
  const { data, error } = await supabase.from('stores').insert(storeToRow(store)).select().single();
  checkError(error, 'addStore');
  return storeFromRow(data);
}
async function addStoresBulk(storeList){
  const { data, error } = await supabase.from('stores').insert(storeList.map(storeToRow)).select();
  checkError(error, 'addStoresBulk');
  return data.map(storeFromRow);
}
async function deleteStore(id){
  const { error } = await supabase.from('stores').delete().eq('id', id);
  checkError(error, 'deleteStore');
}

/* ---- PURCHASE HISTORY ---- */
async function getHistory(){
  const { data, error } = await supabase.from('purchase_history').select('*').order('purchase_date', { ascending:false });
  checkError(error, 'getHistory');
  return data.map(historyFromRow);
}
async function addPurchase(purchase){
  const { data, error } = await supabase.from('purchase_history').insert(historyToRow(purchase)).select().single();
  checkError(error, 'addPurchase');
  return historyFromRow(data);
}
async function addPurchasesBulk(purchaseList){
  const { data, error } = await supabase.from('purchase_history').insert(purchaseList.map(historyToRow)).select();
  checkError(error, 'addPurchasesBulk');
  return data.map(historyFromRow);
}
async function deletePurchase(id){
  const { error } = await supabase.from('purchase_history').delete().eq('id', id);
  checkError(error, 'deletePurchase');
}

/* ---- ORDERS ---- */
async function getOrders(){
  const { data, error } = await supabase.from('orders').select('*').order('order_date', { ascending:false });
  checkError(error, 'getOrders');
  return data.map(orderFromRow);
}
async function addOrder(order){
  const { data, error } = await supabase.from('orders').insert(orderToRow(order)).select().single();
  checkError(error, 'addOrder');
  return orderFromRow(data);
}
async function addOrdersBulk(orderList){
  const { data, error } = await supabase.from('orders').insert(orderList.map(orderToRow)).select();
  checkError(error, 'addOrdersBulk');
  return data.map(orderFromRow);
}
async function updateOrder(id, patch){
  const { data, error } = await supabase.from('orders').update(orderToRow(patch)).eq('id', id).select().single();
  checkError(error, 'updateOrder');
  return orderFromRow(data);
}
async function deleteOrder(id){
  const { error } = await supabase.from('orders').delete().eq('id', id);
  checkError(error, 'deleteOrder');
}

/* ---- CONSUMABLES ---- */
async function getConsumables(){
  const { data, error } = await supabase.from('consumables').select('*').order('updated_at', { ascending:false });
  checkError(error, 'getConsumables');
  return data.map(consumableFromRow);
}
async function addConsumable(item){
  const { data, error } = await supabase.from('consumables').insert(consumableToRow(item)).select().single();
  checkError(error, 'addConsumable');
  return consumableFromRow(data);
}
async function addConsumablesBulk(itemList){
  const { data, error } = await supabase.from('consumables').insert(itemList.map(consumableToRow)).select();
  checkError(error, 'addConsumablesBulk');
  return data.map(consumableFromRow);
}
async function updateConsumable(id, patch){
  const { data, error } = await supabase.from('consumables').update({ ...consumableToRow(patch), updated_at: new Date().toISOString() }).eq('id', id).select().single();
  checkError(error, 'updateConsumable');
  return consumableFromRow(data);
}
async function deleteConsumable(id){
  const { error } = await supabase.from('consumables').delete().eq('id', id);
  checkError(error, 'deleteConsumable');
}

/* ---- LIVE UPDATES (optional) ----
   Supabase Realtime pushes changes to every open tab/device instantly —
   this replaces the old same-tab-only `refreshAll()` pattern.
   Call this once at startup; give it a callback to re-render whichever
   page/dashboard is currently visible.
   Example: subscribeToChanges(() => { renderDashboard(); if (window.__renderOrders) window.__renderOrders(); });
*/
function subscribeToChanges(onChange){
  supabase
    .channel('procurement-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_history' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'consumables' }, onChange)
    .subscribe();
}
