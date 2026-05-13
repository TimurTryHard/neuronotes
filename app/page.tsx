"use client";

import type React from "react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

const colorClasses: Record<NoteColor, string> = {
  default: "border-white/10 bg-white/[0.04]",
  cyan: "border-cyan-400/40 bg-cyan-400/10",
  violet: "border-violet-400/40 bg-violet-400/10",
  pink: "border-pink-400/40 bg-pink-400/10",
  green: "border-emerald-400/40 bg-emerald-400/10",
  orange: "border-orange-400/40 bg-orange-400/10",
};

const colorLabels: { value: NoteColor; label: string }[] = [
  { value: "default", label: "Обычный" },
  { value: "cyan", label: "Голубой" },
  { value: "violet", label: "Фиолетовый" },
  { value: "pink", label: "Розовый" },
  { value: "green", label: "Зелёный" },
  { value: "orange", label: "Оранжевый" },
];

function LogoIcon() {
  return (
      <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 text-lg font-black text-white shadow-[0_0_35px_rgba(139,92,246,0.45)]">
        N✦
      </div>
  );
}

function SidebarButton({
                         active,
                         children,
                         onClick,
                       }: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
      <button
          onClick={onClick}
          className={`w-full rounded-2xl px-4 py-3 text-left transition ${
              active
                  ? "bg-white text-black"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
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
                <p className="text-white/45">Сервис для хранения заметок</p>
              </div>
            </div>

            <h2 className="mb-6 text-5xl font-black leading-tight lg:text-7xl">
              Твои заметки в{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent">
              личном аккаунте
            </span>
            </h2>

            <p className="max-w-xl text-lg leading-8 text-white/60">
              Создавай, закрепляй, раскрашивай и храни заметки в Supabase.
            </p>
          </section>

          <section className="mx-auto w-full max-w-md rounded-[36px] border border-white/10 bg-white/[0.06] p-8 shadow-2xl">
            <h3 className="mb-2 text-3xl font-black">
              {mode === "register" ? "Регистрация" : "Вход"}
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
                  placeholder="Пароль"
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 outline-none"
              />

              <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 px-5 py-4 font-black text-white"
              >
                {mode === "register" ? "Создать аккаунт" : "Войти"}
              </button>
            </form>

            <button
                onClick={() => setMode(mode === "register" ? "login" : "register")}
                className="mt-5 w-full text-sm text-cyan-300"
            >
              {mode === "register"
                  ? "Уже есть аккаунт? Войти"
                  : "Нет аккаунта? Зарегистрироваться"}
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
  const [filter, setFilter] = useState("Все");
  const [folderFilter, setFolderFilter] = useState("Все папки");
  const [loading, setLoading] = useState(false);
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
      console.error("Ошибка загрузки:", error.message);
      setLoading(false);
      return;
    }

    setNotes(data || []);
    setSelectedId(data?.[0]?.id || null);
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

  const folders = useMemo(() => {
    const uniqueFolders = notes
        .map((note) => note.folder || "Личное")
        .filter((folder, index, array) => array.indexOf(folder) === index);

    return ["Все папки", ...uniqueFolders];
  }, [notes]);

  const visibleNotes = useMemo(() => {
    return notes
        .filter((note) => {
          const q = search.toLowerCase();

          const matchesSearch =
              note.title?.toLowerCase().includes(q) ||
              note.text?.toLowerCase().includes(q) ||
              note.tag?.toLowerCase().includes(q) ||
              note.folder?.toLowerCase().includes(q);

          const matchesMainFilter =
              filter === "Все" ||
              (filter === "Закреплённые" && note.pinned) ||
              (filter === "Избранное" && note.favorite) ||
              (filter === "Архив" && note.archived) ||
              note.tag === filter;

          const matchesFolder =
              folderFilter === "Все папки" ||
              (note.folder || "Личное") === folderFilter;

          return matchesSearch && matchesMainFilter && matchesFolder;
        })
        .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [notes, search, filter, folderFilter]);

  async function createNote() {
    if (!user) return;

    const newNote = {
      user_id: user.id,
      title: "Новая заметка",
      text: "Начни писать здесь...",
      tag: "Без тега",
      folder: "Личное",
      date: "Сейчас",
      favorite: false,
      archived: false,
      color: "default",
      pinned: false,
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

    setNotes([data, ...notes]);
    setSelectedId(data.id);
  }

  function updateSelected(
      field: "title" | "text" | "tag" | "date" | "folder" | "color",
      value: string
  ) {
    if (!selectedNote) return;

    setSaveStatus("saving");

    setNotes(
        notes.map((note) =>
            note.id === selectedNote.id ? { ...note, [field]: value } : note
        )
    );

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      const { error } = await supabase
          .from("notes")
          .update({ [field]: value })
          .eq("id", selectedNote.id);

      setSaveStatus(error ? "error" : "saved");
    }, 700);
  }

  async function uploadImage(file: File) {
    if (!selectedNote) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

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

    await supabase
        .from("notes")
        .update({ favorite: !current.favorite })
        .eq("id", id);

    setNotes(
        notes.map((note) =>
            note.id === id ? { ...note, favorite: !note.favorite } : note
        )
    );
  }

  async function toggleArchive(id: number) {
    const current = notes.find((note) => note.id === id);
    if (!current) return;

    await supabase
        .from("notes")
        .update({ archived: !current.archived })
        .eq("id", id);

    setNotes(
        notes.map((note) =>
            note.id === id ? { ...note, archived: !note.archived } : note
        )
    );
  }

  async function togglePinned(id: number) {
    const current = notes.find((note) => note.id === id);
    if (!current) return;

    await supabase
        .from("notes")
        .update({ pinned: !current.pinned })
        .eq("id", id);

    setNotes(
        notes
            .map((note) =>
                note.id === id ? { ...note, pinned: !note.pinned } : note
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

  const filters = [
    "Все",
    "Закреплённые",
    "Избранное",
    "Проекты",
    "Без тега",
    "Архив",
  ];

  if (!user) return <AuthScreen />;

  return (
      <div className="min-h-screen bg-[#070b18] text-white">
        <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_420px_1fr]">
          <aside className="border-r border-white/10 bg-white/[0.03] p-6">
            <div className="mb-10 flex items-center gap-3">
              <LogoIcon />
              <div>
                <h1 className="text-xl font-black">NeuroNotes</h1>
                <p className="text-sm text-white/45">{user.email}</p>
              </div>
            </div>

            <button
                onClick={createNote}
                className="mb-4 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-4 font-bold text-black"
            >
              ＋ Новая заметка
            </button>

            <button
                onClick={logout}
                className="mb-8 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white/70"
            >
              Выйти
            </button>

            <p className="mb-3 text-sm text-white/35">Фильтры</p>

            <div className="mb-8 space-y-2">
              {filters.map((item) => (
                  <SidebarButton
                      key={item}
                      active={filter === item}
                      onClick={() => setFilter(item)}
                  >
                    {item}
                  </SidebarButton>
              ))}
            </div>

            <p className="mb-3 text-sm text-white/35">Папки</p>

            <div className="space-y-2">
              {folders.map((folder) => (
                  <SidebarButton
                      key={folder}
                      active={folderFilter === folder}
                      onClick={() => setFolderFilter(folder)}
                  >
                    📁 {folder}
                  </SidebarButton>
              ))}
            </div>
          </aside>

          <section className="border-r border-white/10 bg-black/20 p-6">
            <h2 className="mb-4 text-3xl font-black">Мои заметки</h2>

            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск заметок..."
                className="mb-6 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            />

            {loading ? (
                <p className="text-white/45">Загрузка...</p>
            ) : (
                <div className="space-y-4">
                  {visibleNotes.map((note) => {
                    const noteColor = note.color || "default";

                    return (
                        <button
                            key={note.id}
                            onClick={() => setSelectedId(note.id)}
                            className={`w-full rounded-3xl border p-5 text-left transition ${
                                selectedId === note.id
                                    ? "border-cyan-400/70 bg-cyan-400/15"
                                    : colorClasses[noteColor]
                            }`}
                        >
                          <div className="mb-3 flex justify-between gap-3">
                            <h3 className="font-bold">
                              {note.pinned && "📌 "}
                              {note.title || "Без названия"}
                            </h3>

                            {note.favorite && (
                                <span className="text-yellow-300">★</span>
                            )}
                          </div>

                          {note.image_url && (
                              <img
                                  src={note.image_url}
                                  alt="Картинка заметки"
                                  className="mb-4 h-28 w-full rounded-2xl object-cover"
                              />
                          )}

                          <p className="mb-4 line-clamp-2 text-sm text-white/55">
                            {note.text || "Пустая заметка"}
                          </p>

                          <div className="flex justify-between text-xs text-white/40">
                            <span>📁 {note.folder || "Личное"}</span>
                            <span>{note.date || "Без даты"}</span>
                          </div>
                        </button>
                    );
                  })}
                </div>
            )}
          </section>

          <section className="p-6 lg:p-10">
            {selectedNote ? (
                <div className="mx-auto max-w-4xl">
                  <div className="mb-6 flex justify-between gap-4">
                    <div className="text-white/45">
                      📁 {selectedNote.folder || "Личное"} · 🏷{" "}
                      {selectedNote.tag || "Без тега"}

                      <span className="ml-4">
                    {saveStatus === "saving" && "💾 Сохранение..."}
                        {saveStatus === "saved" && "✅ Сохранено"}
                        {saveStatus === "error" && "⚠️ Ошибка сохранения"}
                  </span>
                    </div>

                    <div className="flex gap-3">
                      <button
                          onClick={() => togglePinned(selectedNote.id)}
                          className="rounded-2xl bg-white/5 p-3"
                      >
                        📌
                      </button>

                      <button
                          onClick={() => toggleFavorite(selectedNote.id)}
                          className="rounded-2xl bg-white/5 p-3"
                      >
                        ★
                      </button>

                      <button
                          onClick={() => toggleArchive(selectedNote.id)}
                          className="rounded-2xl bg-white/5 p-3"
                      >
                        📦
                      </button>

                      <button
                          onClick={deleteSelected}
                          className="rounded-2xl bg-red-400/10 p-3 text-red-300"
                      >
                        🗑
                      </button>
                    </div>
                  </div>

                  <div
                      className={`rounded-[32px] border p-6 lg:p-10 ${
                          colorClasses[selectedNote.color || "default"]
                      }`}
                  >
                    <input
                        value={selectedNote.title || ""}
                        onChange={(e) => updateSelected("title", e.target.value)}
                        placeholder="Название заметки"
                        className="mb-6 w-full bg-transparent text-4xl font-black outline-none placeholder:text-white/25"
                    />

                    <div className="mb-6 grid gap-4 md:grid-cols-4">
                      <input
                          value={selectedNote.folder || ""}
                          onChange={(e) => updateSelected("folder", e.target.value)}
                          placeholder="Папка"
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                      />

                      <input
                          value={selectedNote.tag || ""}
                          onChange={(e) => updateSelected("tag", e.target.value)}
                          placeholder="Тег"
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                      />

                      <input
                          value={selectedNote.date || ""}
                          onChange={(e) => updateSelected("date", e.target.value)}
                          placeholder="Дата"
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                      />

                      <select
                          value={selectedNote.color || "default"}
                          onChange={(e) => updateSelected("color", e.target.value)}
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                      >
                        {colorLabels.map((color) => (
                            <option key={color.value} value={color.value}>
                              {color.label}
                            </option>
                        ))}
                      </select>
                    </div>

                    <textarea
                        value={selectedNote.text || ""}
                        onChange={(e) => updateSelected("text", e.target.value)}
                        placeholder="Напиши заметку..."
                        className="min-h-[320px] w-full resize-none rounded-3xl border border-white/10 bg-black/20 p-5 text-lg outline-none placeholder:text-white/25"
                    />

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80 hover:bg-white/10">
                        🖼 Загрузить изображение
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
                              onClick={removeImage}
                              className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm text-red-300"
                          >
                            Удалить изображение
                          </button>
                      )}
                    </div>

                    {selectedNote.image_url && (
                        <img
                            src={selectedNote.image_url}
                            alt="Картинка заметки"
                            className="mt-5 max-h-[360px] rounded-3xl object-cover"
                        />
                    )}
                  </div>
                </div>
            ) : (
                <div className="flex h-full items-center justify-center text-white/50">
                  Создай первую заметку
                </div>
            )}
          </section>
        </main>
      </div>
  );
}