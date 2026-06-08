"use client";

import type React from "react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Theme = "dark" | "light";
type NoteColor = "default" | "cyan" | "violet" | "pink" | "green" | "orange";

type Note = {
  id: number;
  user_id: string;
  title: string | null;
  text: string | null;
  tag: string | null;
  folder: string | null;
  date: string | null;
  favorite: boolean;
  archived: boolean;
  color: NoteColor | null;
  pinned: boolean;
  image_url: string | null;
};

const oldDefaultText = "РќР°С‡РЅРё РїРёСЃР°С‚СЊ Р·РґРµСЃСЊ...";

function cleanNoteText(text: string | null) {
  return text === oldDefaultText ? "" : text || "";
}

const colorLabels: { value: NoteColor; label: string }[] = [
  { value: "default", label: "РћР±С‹С‡РЅС‹Р№" },
  { value: "cyan", label: "Р“РѕР»СѓР±РѕР№" },
  { value: "violet", label: "Р¤РёРѕР»РµС‚РѕРІС‹Р№" },
  { value: "pink", label: "Р РѕР·РѕРІС‹Р№" },
  { value: "green", label: "Р—РµР»С‘РЅС‹Р№" },
  { value: "orange", label: "РћСЂР°РЅР¶РµРІС‹Р№" },
];

function getNoteColorClasses(color: NoteColor, theme: Theme) {
  if (theme === "light") {
    const lightColors: Record<NoteColor, string> = {
      default: "border-slate-200 bg-white",
      cyan: "border-cyan-200 bg-cyan-50",
      violet: "border-violet-200 bg-violet-50",
      pink: "border-pink-200 bg-pink-50",
      green: "border-emerald-200 bg-emerald-50",
      orange: "border-orange-200 bg-orange-50",
    };

    return lightColors[color];
  }

  const darkColors: Record<NoteColor, string> = {
    default: "border-white/10 bg-white/[0.04]",
    cyan: "border-cyan-400/40 bg-cyan-400/10",
    violet: "border-violet-400/40 bg-violet-400/10",
    pink: "border-pink-400/40 bg-pink-400/10",
    green: "border-emerald-400/40 bg-emerald-400/10",
    orange: "border-orange-400/40 bg-orange-400/10",
  };

  return darkColors[color];
}

function LogoIcon() {
  return (
      <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 text-lg font-black text-white shadow-[0_0_35px_rgba(139,92,246,0.45)]">
        Nвњ¦
      </div>
  );
}

function SidebarButton({
                         active,
                         children,
                         onClick,
                         theme,
                       }: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  theme: Theme;
}) {
  return (
      <button
          type="button"
          onClick={onClick}
          className={`w-full rounded-2xl px-4 py-3 text-left transition ${
              active
                  ? theme === "dark"
                      ? "bg-white text-black"
                      : "bg-slate-900 text-white"
                  : theme === "dark"
                      ? "text-white/65 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
      >
        {children}
      </button>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const result =
        mode === "register"
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      alert(result.error.message);
    }
  }

  return (
      <div className="min-h-screen bg-[#070b18] text-white">
        <main className="grid min-h-screen items-center gap-10 px-6 py-10 lg:grid-cols-2 lg:px-20">
          <section>
            <div className="mb-8 flex items-center gap-4">
              <LogoIcon />

              <div>
                <h1 className="text-2xl font-black">NeuroNotes</h1>
                <p className="text-white/45">РЎРµСЂРІРёСЃ РґР»СЏ С…СЂР°РЅРµРЅРёСЏ Р·Р°РјРµС‚РѕРє</p>
              </div>
            </div>

            <h2 className="mb-6 text-5xl font-black leading-tight lg:text-7xl">
              РўРІРѕРё Р·Р°РјРµС‚РєРё РІ{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent">
              Р»РёС‡РЅРѕРј Р°РєРєР°СѓРЅС‚Рµ
            </span>
            </h2>

            <p className="max-w-xl text-lg leading-8 text-white/60">
              РЎРѕР·РґР°РІР°Р№, Р·Р°РєСЂРµРїР»СЏР№, СЂР°СЃРєСЂР°С€РёРІР°Р№ Рё С…СЂР°РЅРё Р·Р°РјРµС‚РєРё РІ Supabase.
            </p>
          </section>

          <section className="mx-auto w-full max-w-md rounded-[36px] border border-white/10 bg-white/[0.06] p-8 shadow-2xl">
            <h3 className="mb-2 text-3xl font-black">
              {mode === "register" ? "Р РµРіРёСЃС‚СЂР°С†РёСЏ" : "Р’С…РѕРґ"}
            </h3>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  placeholder="Email"
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 outline-none"
              />

              <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  type="password"
                  placeholder="РџР°СЂРѕР»СЊ"
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 outline-none"
              />

              <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 px-5 py-4 font-black text-white"
              >
                {mode === "register" ? "РЎРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚" : "Р’РѕР№С‚Рё"}
              </button>
            </form>

            <button
                type="button"
                onClick={() => setMode(mode === "register" ? "login" : "register")}
                className="mt-5 w-full text-sm text-cyan-300"
            >
              {mode === "register"
                  ? "РЈР¶Рµ РµСЃС‚СЊ Р°РєРєР°СѓРЅС‚? Р’РѕР№С‚Рё"
                  : "РќРµС‚ Р°РєРєР°СѓРЅС‚Р°? Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ"}
            </button>
          </section>
        </main>
      </div>
  );
}

export default function NotesApp() {
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Р’СЃРµ");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
      "saved"
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadNotes = useCallback(async (userId: string) => {
    setLoading(true);

    const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .order("pinned", { ascending: false })
        .order("id", { ascending: false });

    if (error) {
      console.error("РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё:", error.message);
      setLoading(false);
      return;
    }

    const cleanedNotes = ((data || []) as Note[]).map((note) => ({
      ...note,
      text: cleanNoteText(note.text),
    }));

    setNotes(cleanedNotes);
    setSelectedId(cleanedNotes[0]?.id || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);

      if (data.user) {
        void loadNotes(data.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          const currentUser = session?.user || null;

          setUser(currentUser);

          if (currentUser) {
            void loadNotes(currentUser.id);
          } else {
            setNotes([]);
            setSelectedId(null);
          }
        }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [loadNotes]);

  const selectedNote =
      notes.find((note) => note.id === selectedId) || notes[0] || null;

  const visibleNotes = useMemo(() => {
    return notes
        .filter((note) => {
          const q = search.toLowerCase();
          const noteText = cleanNoteText(note.text);

          const matchesSearch =
              !q ||
              note.title?.toLowerCase().includes(q) ||
              noteText.toLowerCase().includes(q);

          const matchesMainFilter =
              filter === "Р’СЃРµ" ||
              (filter === "Р—Р°РєСЂРµРїР»С‘РЅРЅС‹Рµ" && note.pinned) ||
              (filter === "РР·Р±СЂР°РЅРЅРѕРµ" && note.favorite) ||
              (filter === "РђСЂС…РёРІ" && note.archived);

          return matchesSearch && matchesMainFilter;
        })
        .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [notes, search, filter]);

  async function createNote(
      options: {
        title?: string;
        tag?: string;
        folder?: string;
        pinned?: boolean;
        color?: NoteColor;
      } = {}
  ) {
    if (!user) return;

    const newNote = {
      user_id: user.id,
      title: options.title || "РќРѕРІР°СЏ Р·Р°РјРµС‚РєР°",
      text: "",
      tag: options.tag || "Р‘РµР· С‚РµРіР°",
      folder: options.folder || "Р›РёС‡РЅРѕРµ",
      date: new Date().toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      favorite: false,
      archived: false,
      color: options.color || "default",
      pinned: options.pinned || false,
      image_url: null,
    };

    const { data, error } = await supabase
        .from("notes")
        .insert([newNote])
        .select()
        .single();

    if (error) {
      alert(error.message);
      return;
    }

    setNotes((prev) => [data as Note, ...prev]);
    setSelectedId((data as Note).id);
    setQuickMenuOpen(false);
  }

  function updateSelected(
      field: "title" | "text" | "date" | "color",
      value: string
  ) {
    if (!selectedNote) return;

    const noteId = selectedNote.id;

    setSaveStatus("saving");

    setNotes((prev) =>
        prev.map((note) =>
            note.id === noteId ? ({ ...note, [field]: value } as Note) : note
        )
    );

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      const { error } = await supabase
          .from("notes")
          .update({ [field]: value })
          .eq("id", noteId);

      setSaveStatus(error ? "error" : "saved");
    }, 700);
  }

  async function uploadImage(file: File) {
    if (!selectedNote || !user) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from("note-images")
        .upload(fileName, file, {
          upsert: true,
        });

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("note-images").getPublicUrl(fileName);

    const { error } = await supabase
        .from("notes")
        .update({ image_url: publicUrl })
        .eq("id", selectedNote.id);

    if (error) {
      alert(error.message);
      return;
    }

    setNotes((prev) =>
        prev.map((note) =>
            note.id === selectedNote.id
                ? { ...note, image_url: publicUrl }
                : note
        )
    );
  }

  async function toggleFavorite(id: number) {
    const current = notes.find((note) => note.id === id);
    if (!current) return;

    const nextValue = !current.favorite;

    await supabase.from("notes").update({ favorite: nextValue }).eq("id", id);

    setNotes((prev) =>
        prev.map((note) =>
            note.id === id ? { ...note, favorite: nextValue } : note
        )
    );
  }

  async function toggleArchive(id: number) {
    const current = notes.find((note) => note.id === id);
    if (!current) return;

    const nextValue = !current.archived;

    await supabase.from("notes").update({ archived: nextValue }).eq("id", id);

    setNotes((prev) =>
        prev.map((note) =>
            note.id === id ? { ...note, archived: nextValue } : note
        )
    );
  }

  async function togglePinned(id: number) {
    const current = notes.find((note) => note.id === id);
    if (!current) return;

    const nextValue = !current.pinned;

    await supabase.from("notes").update({ pinned: nextValue }).eq("id", id);

    setNotes((prev) =>
        prev
            .map((note) =>
                note.id === id ? { ...note, pinned: nextValue } : note
            )
            .sort((a, b) => Number(b.pinned) - Number(a.pinned))
    );
  }

  async function deleteSelected() {
    if (!selectedNote) return;

    await supabase.from("notes").delete().eq("id", selectedNote.id);

    const updated = notes.filter((note) => note.id !== selectedNote.id);

    setNotes(updated);
    setSelectedId(updated[0]?.id || null);
    setDeleteModalOpen(false);
  }

  async function removeImage() {
    if (!selectedNote) return;

    const { error } = await supabase
        .from("notes")
        .update({ image_url: null })
        .eq("id", selectedNote.id);

    if (error) {
      alert(error.message);
      return;
    }

    setNotes((prev) =>
        prev.map((note) =>
            note.id === selectedNote.id ? { ...note, image_url: null } : note
        )
    );
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  const filters = ["Р’СЃРµ", "Р—Р°РєСЂРµРїР»С‘РЅРЅС‹Рµ", "РР·Р±СЂР°РЅРЅРѕРµ", "РђСЂС…РёРІ"];

  function getFilterCount(filterName: string) {
    switch (filterName) {
      case "Р’СЃРµ":
        return notes.length;

      case "Р—Р°РєСЂРµРїР»С‘РЅРЅС‹Рµ":
        return notes.filter((note) => note.pinned).length;

      case "РР·Р±СЂР°РЅРЅРѕРµ":
        return notes.filter((note) => note.favorite).length;

      case "РђСЂС…РёРІ":
        return notes.filter((note) => note.archived).length;

      default:
        return 0;
    }
  }

  if (!user) return <AuthScreen />;

  return (
      <div
          className={`min-h-screen ${
              theme === "dark"
                  ? "bg-[#070b18] text-white"
                  : "bg-[#f4f7fb] text-slate-900"
          }`}
      >
        <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_420px_1fr]">
          <aside
              className={`border-r p-6 ${
                  theme === "dark"
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-slate-200 bg-white"
              }`}
          >
            <div className="mb-8 flex items-center gap-3">
              <LogoIcon />

              <div>
                <h1 className="text-xl font-black">NeuroNotes</h1>
                <p
                    className={`text-sm ${
                        theme === "dark" ? "text-white/45" : "text-slate-500"
                    }`}
                >
                  {user.email}
                </p>
              </div>
            </div>

            <button
                type="button"
                onClick={logout}
                className={`mb-4 w-full rounded-2xl border px-5 py-3 transition ${
                    theme === "dark"
                        ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                }`}
            >
              Р’С‹Р№С‚Рё
            </button>

            <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`mb-8 w-full rounded-2xl border px-5 py-3 transition ${
                    theme === "dark"
                        ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                }`}
            >
              {theme === "dark" ? "вЂпёЏ РЎРІРµС‚Р»Р°СЏ С‚РµРјР°" : "рџЊ™ РўС‘РјРЅР°СЏ С‚РµРјР°"}
            </button>

            <p
                className={`mb-3 text-sm ${
                    theme === "dark" ? "text-white/35" : "text-slate-400"
                }`}
            >
              Р¤РёР»СЊС‚СЂС‹
            </p>

            <div className="space-y-2">
              {filters.map((item) => (
                  <SidebarButton
                      key={item}
                      active={filter === item}
                      onClick={() => setFilter(item)}
                      theme={theme}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{item}</span>

                      <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                              filter === item
                                  ? theme === "dark"
                                      ? "bg-black/10 text-black"
                                      : "bg-white/20 text-white"
                                  : theme === "dark"
                                      ? "bg-white/10 text-white/60"
                                      : "bg-slate-200 text-slate-600"
                          }`}
                      >
                    {getFilterCount(item)}
                  </span>
                    </div>
                  </SidebarButton>
              ))}
            </div>
          </aside>

          <section
              className={`border-r p-6 ${
                  theme === "dark"
                      ? "border-white/10 bg-black/20"
                      : "border-slate-200 bg-slate-50"
              }`}
          >
            <h2 className="mb-4 text-3xl font-black">РњРѕРё Р·Р°РјРµС‚РєРё</h2>

            <div className="relative mb-6">
              <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="РџРѕРёСЃРє Р·Р°РјРµС‚РѕРє..."
                  className={`w-full rounded-2xl border px-4 py-3 pr-12 outline-none ${
                      theme === "dark"
                          ? "border-white/10 bg-white/5 text-white placeholder:text-white/35"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                  }`}
              />

              {search.length > 0 && (
                  <button
                      type="button"
                      onClick={() => setSearch("")}
                      className={`absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-sm font-bold transition ${
                          theme === "dark"
                              ? "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-900"
                      }`}
                  >
                    Г—
                  </button>
              )}
            </div>

            {loading ? (
                <p className={theme === "dark" ? "text-white/45" : "text-slate-500"}>
                  Р—Р°РіСЂСѓР·РєР°...
                </p>
            ) : visibleNotes.length > 0 ? (
                <div className="space-y-4">
                  {visibleNotes.map((note) => {
                    const noteColor = note.color || "default";
                    const previewText = cleanNoteText(note.text);

                    return (
                        <button
                            type="button"
                            key={note.id}
                            onClick={() => setSelectedId(note.id)}
                            className={`w-full rounded-3xl border p-5 text-left transition ${
                                selectedId === note.id
                                    ? theme === "dark"
                                        ? "border-cyan-400/70 bg-cyan-400/15"
                                        : "border-cyan-400 bg-cyan-50"
                                    : getNoteColorClasses(noteColor, theme)
                            }`}
                        >
                          <div className="mb-3 flex justify-between gap-3">
                            <h3 className="font-bold">
                              {note.pinned && "рџ“Њ "}
                              {note.title || "Р‘РµР· РЅР°Р·РІР°РЅРёСЏ"}
                            </h3>

                            {note.favorite && (
                                <span className="text-yellow-400">в…</span>
                            )}
                          </div>

                          {note.image_url && (
                              <img
                                  src={note.image_url}
                                  alt="РљР°СЂС‚РёРЅРєР° Р·Р°РјРµС‚РєРё"
                                  className="mb-4 h-28 w-full rounded-2xl object-cover"
                              />
                          )}

                          <p
                              className={`mb-4 line-clamp-2 text-sm ${
                                  theme === "dark" ? "text-white/55" : "text-slate-500"
                              }`}
                          >
                            {previewText || "РџСѓСЃС‚Р°СЏ Р·Р°РјРµС‚РєР°"}
                          </p>

                          <div
                              className={`flex justify-end text-xs ${
                                  theme === "dark" ? "text-white/40" : "text-slate-400"
                              }`}
                          >
                            <span>{note.date || "Р‘РµР· РґР°С‚С‹"}</span>
                          </div>
                        </button>
                    );
                  })}
                </div>
            ) : (
                <div
                    className={`flex min-h-[300px] items-center justify-center rounded-3xl border border-dashed ${
                        theme === "dark"
                            ? "border-white/10 text-white/40"
                            : "border-slate-300 text-slate-400"
                    }`}
                >
                  РЎРѕР·РґР°Р№ РїРµСЂРІСѓСЋ Р·Р°РјРµС‚РєСѓ
                </div>
            )}
          </section>

          <section className="p-6 lg:p-10">
            {selectedNote ? (
                <div className="mx-auto max-w-4xl">
                  <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row">
                    <div
                        className={
                          theme === "dark" ? "text-white/45" : "text-slate-500"
                        }
                    >
                      {saveStatus === "saving" && "рџ’ѕ РЎРѕС…СЂР°РЅРµРЅРёРµ..."}
                      {saveStatus === "saved" && "вњ… РЎРѕС…СЂР°РЅРµРЅРѕ"}
                      {saveStatus === "error" && "вљ пёЏ РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ"}
                    </div>

                    <div className="flex gap-3">
                      <button
                          type="button"
                          onClick={() => togglePinned(selectedNote.id)}
                          className={`rounded-2xl p-3 transition ${
                              theme === "dark"
                                  ? "bg-white/5 hover:bg-white/10"
                                  : "bg-white shadow-sm hover:bg-slate-100"
                          }`}
                      >
                        рџ“Њ
                      </button>

                      <button
                          type="button"
                          onClick={() => toggleFavorite(selectedNote.id)}
                          className={`rounded-2xl p-3 transition ${
                              theme === "dark"
                                  ? "bg-white/5 hover:bg-white/10"
                                  : "bg-white shadow-sm hover:bg-slate-100"
                          }`}
                      >
                        в…
                      </button>

                      <button
                          type="button"
                          onClick={() => toggleArchive(selectedNote.id)}
                          className={`rounded-2xl p-3 transition ${
                              theme === "dark"
                                  ? "bg-white/5 hover:bg-white/10"
                                  : "bg-white shadow-sm hover:bg-slate-100"
                          }`}
                      >
                        рџ“¦
                      </button>

                      <button
                          type="button"
                          onClick={() => setDeleteModalOpen(true)}
                          className="rounded-2xl bg-red-400/10 p-3 text-red-400 transition hover:bg-red-400/20"
                      >
                        рџ—‘
                      </button>
                    </div>
                  </div>

                  <div
                      className={`rounded-[32px] border p-6 lg:p-10 ${
                          getNoteColorClasses(selectedNote.color || "default", theme)
                      }`}
                  >
                    <input
                        value={selectedNote.title || ""}
                        onChange={(e) => updateSelected("title", e.target.value)}
                        placeholder="РќР°Р·РІР°РЅРёРµ Р·Р°РјРµС‚РєРё"
                        className={`mb-6 w-full bg-transparent text-4xl font-black outline-none ${
                            theme === "dark"
                                ? "placeholder:text-white/25"
                                : "placeholder:text-slate-300"
                        }`}
                    />

                    <div className="mb-6 grid gap-4 md:grid-cols-2">
                      <input
                          value={selectedNote.date || ""}
                          onChange={(e) => updateSelected("date", e.target.value)}
                          placeholder="Р”Р°С‚Р°"
                          className={`rounded-2xl border px-4 py-3 outline-none ${
                              theme === "dark"
                                  ? "border-white/10 bg-black/20 text-white placeholder:text-white/30"
                                  : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                          }`}
                      />

                      <select
                          value={selectedNote.color || "default"}
                          onChange={(e) => updateSelected("color", e.target.value)}
                          className={`rounded-2xl border px-4 py-3 outline-none ${
                              theme === "dark"
                                  ? "border-white/10 bg-black/20 text-white"
                                  : "border-slate-200 bg-white text-slate-900"
                          }`}
                      >
                        {colorLabels.map((color) => (
                            <option key={color.value} value={color.value}>
                              {color.label}
                            </option>
                        ))}
                      </select>
                    </div>

                    <textarea
                        value={cleanNoteText(selectedNote.text)}
                        onChange={(e) => updateSelected("text", e.target.value)}
                        placeholder="РќР°РїРёС€Рё Р·Р°РјРµС‚РєСѓ..."
                        className={`min-h-[320px] w-full resize-none rounded-3xl border p-5 text-lg outline-none ${
                            theme === "dark"
                                ? "border-white/10 bg-black/20 text-white placeholder:text-white/25"
                                : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                        }`}
                    />

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label
                          className={`cursor-pointer rounded-2xl border px-5 py-3 text-sm transition ${
                              theme === "dark"
                                  ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        рџ–ј Р—Р°РіСЂСѓР·РёС‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void uploadImage(file);
                            }}
                            className="hidden"
                        />
                      </label>

                      {selectedNote.image_url && (
                          <button
                              type="button"
                              onClick={removeImage}
                              className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm text-red-400"
                          >
                            РЈРґР°Р»РёС‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ
                          </button>
                      )}
                    </div>

                    {selectedNote.image_url && (
                        <img
                            src={selectedNote.image_url}
                            alt="РљР°СЂС‚РёРЅРєР° Р·Р°РјРµС‚РєРё"
                            className="mt-5 max-h-[360px] rounded-3xl object-cover"
                        />
                    )}
                  </div>
                </div>
            ) : (
                <div
                    className={`flex h-full items-center justify-center ${
                        theme === "dark" ? "text-white/50" : "text-slate-400"
                    }`}
                >
                  РЎРѕР·РґР°Р№ РїРµСЂРІСѓСЋ Р·Р°РјРµС‚РєСѓ
                </div>
            )}
          </section>
        </main>

        {deleteModalOpen && selectedNote && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
              <div
                  className={`w-full max-w-md rounded-[32px] border p-7 shadow-2xl ${
                      theme === "dark"
                          ? "border-white/10 bg-[#10162a] text-white"
                          : "border-slate-200 bg-white text-slate-900"
                  }`}
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-2xl text-red-400">
                  рџ—‘
                </div>

                <h3 className="mb-3 text-2xl font-black">РЈРґР°Р»РёС‚СЊ Р·Р°РјРµС‚РєСѓ?</h3>

                <p
                    className={`mb-6 leading-7 ${
                        theme === "dark" ? "text-white/55" : "text-slate-500"
                    }`}
                >
                  Р—Р°РјРµС‚РєР° В«{selectedNote.title || "Р‘РµР· РЅР°Р·РІР°РЅРёСЏ"}В» Р±СѓРґРµС‚ СѓРґР°Р»РµРЅР°.
                  Р­С‚Рѕ РґРµР№СЃС‚РІРёРµ РЅРµР»СЊР·СЏ РѕС‚РјРµРЅРёС‚СЊ.
                </p>

                <div className="flex justify-end gap-3">
                  <button
                      type="button"
                      onClick={() => setDeleteModalOpen(false)}
                      className={`rounded-2xl border px-5 py-3 font-bold transition ${
                          theme === "dark"
                              ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    РћС‚РјРµРЅР°
                  </button>

                  <button
                      type="button"
                      onClick={deleteSelected}
                      className="rounded-2xl bg-red-500 px-5 py-3 font-bold text-white transition hover:bg-red-600"
                  >
                    РЈРґР°Р»РёС‚СЊ
                  </button>
                </div>
              </div>
            </div>
        )}

        <div className="fixed bottom-6 right-6 z-40">
          {quickMenuOpen && (
              <div className="mb-4 flex flex-col items-end gap-3">
                <button
                    type="button"
                    onClick={() =>
                        createNote({
                          title: "РќРѕРІР°СЏ Р·Р°РјРµС‚РєР°",
                        })
                    }
                    className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-lg transition ${
                        theme === "dark"
                            ? "bg-white text-slate-900 hover:bg-white/90"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                >
                  РўРµРєСЃС‚РѕРІР°СЏ Р·Р°РјРµС‚РєР°
                </button>

                <button
                    type="button"
                    onClick={() =>
                        createNote({
                          title: "Р’Р°Р¶РЅР°СЏ Р·Р°РјРµС‚РєР°",
                          pinned: true,
                        })
                    }
                    className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-lg transition ${
                        theme === "dark"
                            ? "bg-white text-slate-900 hover:bg-white/90"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                >
                  Р—Р°РєСЂРµРїР»С‘РЅРЅР°СЏ Р·Р°РјРµС‚РєР°
                </button>

                <button
                    type="button"
                    onClick={() =>
                        createNote({
                          title: "РџСЂРѕРµРєС‚РЅР°СЏ Р·Р°РјРµС‚РєР°",
                          tag: "РџСЂРѕРµРєС‚С‹",
                          folder: "РџСЂРѕРµРєС‚С‹",
                          color: "violet",
                        })
                    }
                    className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-lg transition ${
                        theme === "dark"
                            ? "bg-white text-slate-900 hover:bg-white/90"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                >
                  РџСЂРѕРµРєС‚РЅР°СЏ Р·Р°РјРµС‚РєР°
                </button>
              </div>
          )}

          <button
              type="button"
              onClick={() => setQuickMenuOpen(!quickMenuOpen)}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 text-3xl font-black text-white shadow-[0_0_35px_rgba(139,92,246,0.55)] transition hover:scale-105"
          >
            {quickMenuOpen ? "Г—" : "+"}
          </button>
        </div>
      </div>
  );
}
