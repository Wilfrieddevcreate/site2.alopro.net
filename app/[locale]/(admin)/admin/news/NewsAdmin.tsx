"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { confirmDelete, showSuccess } from "@/app/lib/swal";
import NewsDetailModal from "@/app/[locale]/components/NewsDetailModal";

const PAGE_SIZE = 20;
const LANGS = [
  { code: "en", label: "EN", flag: "gb" },
  { code: "fr", label: "FR", flag: "fr" },
  { code: "es", label: "ES", flag: "es" },
  { code: "tr", label: "TR", flag: "tr" },
];

interface NewsImage { id: string; url: string; sortOrder: number; }
interface NewsData { id: string; title: string; description: string; imageUrl: string; active: boolean; createdAt: string; images?: NewsImage[]; }

export default function NewsAdmin() {
  const [news, setNews] = useState<NewsData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [formLang, setFormLang] = useState("fr");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedNews, setSelectedNews] = useState<{ id: string; title: string; description: string; images: string[]; date: string } | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const pageRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const initialLoaded = useRef(false);

  const inputClass = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-primary";

  const fetchNews = useCallback(async (page: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/news?skip=${page * PAGE_SIZE}&take=${PAGE_SIZE}`);
      const data = await res.json();
      const items: NewsData[] = data.items || [];
      setTotal(data.total || 0);
      if (append) setNews((prev) => [...prev, ...items]);
      else setNews(items);
      setHasMore(items.length === PAGE_SIZE);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!initialLoaded.current) { initialLoaded.current = true; fetchNews(0, false); }
  }, [fetchNews]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        pageRef.current += 1;
        fetchNews(pageRef.current, true);
      }
    }, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, fetchNews]);

  function reload() { pageRef.current = 0; fetchNews(0, false); }

  async function handleUploadImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image`); continue; }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large (max 5MB)`); continue; }

      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (res.ok) {
          const { url } = await res.json();
          urls.push(url);
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      } catch {
        toast.error(`Error uploading ${file.name}`);
      }
    }

    setUploadedImages((prev) => [...prev, ...urls]);
    setUploading(false);
    if (urls.length > 0) toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleTranslate() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const titleFr = fd.get("title_fr") as string;
    const descFr = fd.get("description_fr") as string;

    if (!titleFr || !descFr) { toast.error("Fill in the French title and description first"); return; }

    setTranslating(true);
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleFr, description: descFr }),
      });
      const data = await res.json();

      if (data.translations) {
        const form = formRef.current;
        const setVal = (name: string, val: string) => {
          const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement;
          if (input && val) { input.value = val; }
        };

        if (data.translations.en) { setVal("title_en", data.translations.en.title); setVal("description_en", data.translations.en.description); }
        if (data.translations.es) { setVal("title_es", data.translations.es.title); setVal("description_es", data.translations.es.description); }
        if (data.translations.tr) { setVal("title_tr", data.translations.tr.title); setVal("description_tr", data.translations.tr.description); }

        setTranslated(true);
        toast.success("Translated to EN, ES, TR!");
      } else {
        toast.error(data.error || "Translation failed");
      }
    } catch {
      toast.error("Translation error");
    }
    setTranslating(false);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (uploadedImages.length === 0) { toast.error("Please upload at least one image"); return; }

    setCreating(true);
    const fd = new FormData(e.currentTarget);

    const titleFrVal = fd.get("title_fr") as string;
    const descFrVal = fd.get("description_fr") as string;
    const title = (fd.get("title_en") as string) || titleFrVal;
    const description = (fd.get("description_en") as string) || descFrVal;

    if (!titleFrVal || !descFrVal) { toast.error("French title and description are required"); setCreating(false); return; }

    await fetch("/api/admin/news", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description,
        titleFr: titleFrVal, descriptionFr: descFrVal,
        titleEs: fd.get("title_es") || null, descriptionEs: fd.get("description_es") || null,
        titleTr: fd.get("title_tr") || null, descriptionTr: fd.get("description_tr") || null,
        imageUrls: uploadedImages,
      }),
    });
    setCreating(false);
    setShowForm(false);
    setUploadedImages([]);
    showSuccess("Published", "News article has been published in all languages.");
    reload();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch("/api/admin/news", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active: !active }) });
    toast.success(active ? "News deactivated" : "News activated");
    reload();
  }

  async function deleteNews(id: string) {
    const confirmed = await confirmDelete("this article");
    if (!confirmed) return;
    await fetch("/api/admin/news", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    showSuccess("Deleted", "Article has been removed.");
    reload();
  }

  return (
    <div className="pt-8 lg:pt-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">News <span className="text-white/30 text-lg">({total})</span></h1>
        <button onClick={() => { setShowForm(!showForm); setTranslated(false); setFormLang("fr"); setUploadedImages([]); }} className="btn-glow rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          {showForm ? "Cancel" : "+ New Article"}
        </button>
      </div>

      {showForm && (
        <form ref={formRef} method="POST" onSubmit={handleCreate} className="card-dark p-6 mb-6 space-y-4">
          {/* Language tabs */}
          <div className="flex gap-2 mb-2">
            {LANGS.map((l) => (
              <button key={l.code} type="button" onClick={() => setFormLang(l.code)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${formLang === l.code ? "bg-primary text-white" : "bg-white/5 text-white/40 hover:text-white/60"}`}>
                <img src={`https://flagcdn.com/w20/${l.flag}.png`} alt={l.label} className="w-4 h-3 rounded-sm object-cover" />
                {l.label}
                {l.code === "fr" && <span className="text-[8px] text-white/30">*</span>}
              </button>
            ))}
          </div>

          {/* Fields per language */}
          {LANGS.map((l) => (
            <div key={l.code} className={formLang === l.code ? "space-y-4" : "hidden"}>
              <div>
                <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">
                  Title ({l.label}) {l.code === "fr" && <span className="text-red-400">*</span>}
                </label>
                <input name={`title_${l.code}`} required={l.code === "fr"} placeholder={`Title in ${l.label}...`} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">
                  Description ({l.label}) {l.code === "fr" && <span className="text-red-400">*</span>}
                </label>
                <textarea name={`description_${l.code}`} required={l.code === "fr"} rows={4} placeholder={`Description in ${l.label}...`} className={`${inputClass} resize-none`} />
              </div>
            </div>
          ))}

          {/* Multi image upload */}
          <div>
            <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">
              Images <span className="text-red-400">*</span> <span className="text-white/15 normal-case">(max 5MB each, multiple allowed)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUploadImages}
              disabled={uploading}
              className="block w-full text-sm text-white/50 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/15 file:text-primary hover:file:bg-primary/25 file:cursor-pointer"
            />
            {uploading && (
              <div className="flex items-center gap-2 mt-2">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-primary">Uploading...</span>
              </div>
            )}

            {/* Preview */}
            {uploadedImages.length > 0 && (
              <div className="flex gap-3 mt-3 flex-wrap">
                {uploadedImages.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Image ${i + 1}`} className="h-20 w-20 rounded-xl object-cover border border-white/10" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    {i === 0 && <span className="absolute bottom-0.5 left-0.5 rounded bg-primary/80 px-1 text-[8px] font-bold text-white">MAIN</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button type="button" onClick={handleTranslate} disabled={translating || translated} className="rounded-xl border border-primary/30 bg-primary/10 px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 disabled:opacity-50 transition-all flex items-center gap-2">
              {translating ? (
                <><div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Translating...</>
              ) : translated ? (
                <><svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Translated</>
              ) : (
                <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" /></svg> Translate from FR</>
              )}
            </button>
            <button type="submit" disabled={creating || uploadedImages.length === 0 || !translated} className="btn-glow rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
              {creating ? "Publishing..." : !translated ? "Translate first" : "Publish"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {news.map((n) => (
          <div key={n.id} className="card-dark overflow-hidden cursor-pointer" onClick={() => setSelectedNews({ id: n.id, title: n.title, description: n.description, images: n.images?.map((img) => img.url) || (n.imageUrl ? [n.imageUrl] : []), date: n.createdAt })}>
            <div className="h-36 bg-white/5 relative">
              <img src={n.images?.[0]?.url || n.imageUrl} alt={n.title} className="h-full w-full object-cover" />
              {(n.images?.length || 0) > 1 && (
                <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                  +{(n.images?.length || 1) - 1}
                </span>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white mb-1">{n.title}</h3>
              <p className="text-xs text-white/30 line-clamp-2 mb-3">{n.description}</p>
              <div className="flex items-center justify-between">
                <button onClick={(e) => { e.stopPropagation(); toggleActive(n.id, n.active); }} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase cursor-pointer hover:opacity-80 transition-opacity ${n.active ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/30"}`}>
                  {n.active ? "Active" : "Off"}
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteNews(n.id); }} className="text-red-400/50 hover:text-red-400 cursor-pointer">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loading && <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        </div>
      )}
      {!hasMore && news.length > 0 && <p className="text-center text-xs text-white/20 py-4">All news loaded</p>}

      {/* News Detail Modal */}
      <NewsDetailModal news={selectedNews} onClose={() => setSelectedNews(null)} />
    </div>
  );
}
