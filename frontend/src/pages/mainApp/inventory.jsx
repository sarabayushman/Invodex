import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Edit3, FolderPlus, PackageOpen, Plus, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import {
  fetchProductCategories,
  mapProductCategoryFromDb,
  mapProductFromDb,
  saveProductToCategory,
  upsertProductCategory,
} from "../../services/invodexData";
import { emptyProduct, formatMoney, loadWorkspace } from "./workspace";

const emptyCategory = { title: "", description: "" };

function Inventory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Product List");
  const [orgId, setOrgId] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState(emptyCategory);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productDraft, setProductDraft] = useState(emptyProduct);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    loadWorkspace(navigate).then(async (workspace) => {
      if (!mounted || workspace.redirected) return;
      if (workspace.error) {
        setError(workspace.error);
        setLoading(false);
        return;
      }

      setOrgId(workspace.orgId);
      setProducts(workspace.products);

      const categoryResult = await fetchProductCategories(workspace.orgId);
      if (!mounted) return;
      if (categoryResult.error) setError(categoryResult.error.message);
      else setCategories((categoryResult.data || []).map(mapProductCategoryFromDb).filter(Boolean));
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) || null,
    [categories, selectedCategoryId],
  );

  async function saveCategory() {
    if (!categoryDraft.title.trim()) return;
    setSaving(true);
    const result = await upsertProductCategory(orgId, categoryDraft);
    if (result.error) setError(result.error.message);
    else {
      const savedCategory = mapProductCategoryFromDb({ ...result.data, product_category_items: [] });
      setCategories((current) => [savedCategory, ...current.filter((category) => category.id !== savedCategory.id)]);
      setCategoryDraft(emptyCategory);
      setCategoryDialogOpen(false);
    }
    setSaving(false);
  }

  function openNewProductDialog() {
    setProductDraft(emptyProduct);
    setProductDialogOpen(true);
  }

  function openEditProductDialog(product) {
    setProductDraft(product);
    setProductDialogOpen(true);
  }

  async function saveProduct() {
    if (!selectedCategory || !productDraft.name.trim()) return;
    setSaving(true);
    const result = await saveProductToCategory(orgId, selectedCategory.id, productDraft);
    if (result.error) setError(result.error.message);
    else {
      const savedProduct = mapProductFromDb(result.data);
      setProducts((current) => upsertSortedProduct(current, savedProduct));
      setCategories((current) =>
        current.map((category) =>
          category.id === selectedCategory.id
            ? { ...category, products: upsertSortedProduct(category.products, savedProduct) }
            : category,
        ),
      );
      setProductDraft(emptyProduct);
      setProductDialogOpen(false);
    }
    setSaving(false);
  }

  if (loading) return <div className="empty-list">Loading inventory...</div>;

  return (
    <section className="management-page inventory-page">
      {error ? <div className="empty-list">Supabase error: {error}</div> : null}

      <div className="inventory-tabs segment-control" role="tablist" aria-label="Inventory section">
        {["Product List", "Inventory"].map((tab) => (
          <button
            className={activeTab === tab ? "active" : ""}
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setSelectedCategoryId("");
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Product List" ? (
        selectedCategory ? (
          <CategoryProductsView
            category={selectedCategory}
            onBack={() => setSelectedCategoryId("")}
            onAddProduct={openNewProductDialog}
            onEditProduct={openEditProductDialog}
          />
        ) : (
          <CategoryGrid
            categories={categories}
            onCreateCategory={() => setCategoryDialogOpen(true)}
            onSelectCategory={setSelectedCategoryId}
          />
        )
      ) : (
        <section className="product-card inventory-blank">
          <PackageOpen size={28} />
        </section>
      )}

      {categoryDialogOpen ? (
        <Dialog title="Make new category" onClose={() => setCategoryDialogOpen(false)}>
          <label className="mini-field">
            <span>Title</span>
            <input
              autoFocus
              value={categoryDraft.title}
              onChange={(event) => setCategoryDraft((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label className="notes-field plain-note">
            <span>Description</span>
            <textarea
              value={categoryDraft.description}
              onChange={(event) => setCategoryDraft((current) => ({ ...current, description: event.target.value }))}
            />
          </label>
          <div className="dialog-actions">
            <Button className="secondary-action" type="button" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveCategory} disabled={saving || !categoryDraft.title.trim()}>
              <Save size={17} /> Save category
            </Button>
          </div>
        </Dialog>
      ) : null}

      {productDialogOpen ? (
        <Dialog title={productDraft.id ? "Edit product" : "Add product to list"} onClose={() => setProductDialogOpen(false)} wide>
          <ProductForm draft={productDraft} setDraft={setProductDraft} />
          <div className="dialog-actions">
            <Button className="secondary-action" type="button" onClick={() => setProductDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveProduct} disabled={saving || !productDraft.name.trim()}>
              <Save size={17} /> Save product
            </Button>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}

function CategoryGrid({ categories, onCreateCategory, onSelectCategory }) {
  return (
    <section className="product-card inventory-section">
      <div className="section-heading">
        <div>
          <p>Product List</p>
          <h3>Categories</h3>
        </div>
        <Button type="button" onClick={onCreateCategory}>
          <FolderPlus size={17} /> Make new category
        </Button>
      </div>

      <div className="category-grid">
        {categories.map((category) => (
          <button className="category-tile" key={category.id} type="button" onClick={() => onSelectCategory(category.id)}>
            <strong>{category.title}</strong>
            <span>{category.description || "No description"}</span>
            <small>{category.products.length} products</small>
          </button>
        ))}
      </div>

      {!categories.length ? <p className="empty-list">No product categories yet.</p> : null}
    </section>
  );
}

function CategoryProductsView({ category, onBack, onAddProduct, onEditProduct }) {
  return (
    <section className="product-card inventory-section">
      <div className="category-detail-header">
        <button className="category-back" type="button" onClick={onBack} aria-label="Back to categories">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h3>{category.title}</h3>
          <p>{category.description || "No description"}</p>
        </div>
        <Button type="button" onClick={onAddProduct}>
          <Plus size={17} /> Add product to list
        </Button>
      </div>

      <div className="product-vertical-list">
        {category.products.map((product) => (
          <article className="product-list-row" key={product.id || product.pid}>
            <div>
              <strong>{product.name}</strong>
              <span>{product.pid || "No PID"} | {product.hsn || "No HSN"}</span>
              <small>{product.desc || "No description"}</small>
            </div>
            <div className="product-row-meta">
              <b>{formatMoney(product.unit)}</b>
              <small>GST {product.gst || 0}%</small>
            </div>
            <button className="icon-button" type="button" onClick={() => onEditProduct(product)} aria-label={`Edit ${product.name}`}>
              <Edit3 size={17} />
            </button>
          </article>
        ))}
      </div>

      {!category.products.length ? <p className="empty-list">No products saved inside this category yet.</p> : null}
    </section>
  );
}

function ProductForm({ draft, setDraft }) {
  const fields = [
    ["pid", "PID"],
    ["hsn", "HSN Code"],
    ["name", "Name"],
    ["desc", "Description"],
    ["cost", "Cost price", "number"],
    ["margin", "Profit margin"],
    ["shownDiscount", "Shown discount", "number"],
    ["unit", "Unit price", "number"],
    ["extraDiscount", "Extra discount", "number"],
    ["gst", "GST %", "number"],
  ];

  return (
    <div className="form-grid product-dialog-grid">
      {fields.map(([key, label, type]) => (
        <label className={key === "desc" ? "notes-field plain-note" : "mini-field"} key={key}>
          <span>{label}</span>
          {key === "desc" ? (
            <textarea
              value={draft[key] ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
            />
          ) : (
            <input
              type={type || "text"}
              value={draft[key] ?? ""}
              onChange={(event) =>
                setDraft((current) => ({ ...current, [key]: type === "number" ? Number(event.target.value) : event.target.value }))
              }
            />
          )}
        </label>
      ))}
    </div>
  );
}

function Dialog({ title, children, onClose, wide = false }) {
  return (
    <div className="dialog-backdrop">
      <section className={`dialog-card ${wide ? "wide" : ""}`}>
        <div className="dialog-header">
          <h3>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>
        <div className="dialog-content">{children}</div>
      </section>
    </div>
  );
}

function upsertSortedProduct(list, product) {
  return [...list.filter((item) => item.id !== product.id), product].sort((first, second) => first.name.localeCompare(second.name));
}

export default Inventory;
