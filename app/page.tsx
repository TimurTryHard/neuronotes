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
  folder: string | null;
  folder_id: number | null;
  date: string | null;
  favorite: boolean;
  archived: boolean;
  deleted: boolean | null;
  color: NoteColor | null;
  pinned: boolean;
  image_url: string | null;
};
type Folder = {
  id: number;
  user_id: string;
  name: string;
  created_at: string | null;
};

const oldDefaultText = "Начни писать здесь...";
const defaultFolderName = "\u041b\u0438\u0447\u043d\u043e\u0435";
const allFoldersFilter = "\u0412\u0441\u0435 \u043f\u0430\u043f\u043a\u0438";
const allNotesFilter = "\u0412\u0441\u0435";
const pinnedFilter = "\u0417\u0430\u043a\u0440\u0435\u043f\u043b\u0451\u043d\u043d\u044b\u0435";
const favoriteFilter = "\u0418\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435";
const archiveFilter = "\u0410\u0440\u0445\u0438\u0432";
const trashFilter = "\u041a\u043e\u0440\u0437\u0438\u043d\u0430";
const foldersLabel = "\u041f\u0430\u043f\u043a\u0438";
const folderLabel = "\u041f\u0430\u043f\u043a\u0430";
const organizationUpdatedMessage =
    "\u041f\u0430\u043f\u043a\u0430 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0430";
const movedToTrashMessage =
    "\u0417\u0430\u043c\u0435\u0442\u043a\u0430 \u043f\u0435\u0440\u0435\u043c\u0435\u0449\u0435\u043d\u0430 \u0432 \u043a\u043e\u0440\u0437\u0438\u043d\u0443";
const restoredFromTrashMessage =
    "\u0417\u0430\u043c\u0435\u0442\u043a\u0430 \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0430";
const permanentlyDeletedMessage =
    "\u0417\u0430\u043c\u0435\u0442\u043a\u0430 \u0443\u0434\u0430\u043b\u0435\u043d\u0430 \u043d\u0430\u0432\u0441\u0435\u0433\u0434\u0430";
const deleteFolderTitle = "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u043f\u0430\u043f\u043a\u0443?";
const deleteFolderDescription =
    "\u0417\u0430\u043c\u0435\u0442\u043a\u0438 \u043d\u0435 \u0443\u0434\u0430\u043b\u044f\u0442\u0441\u044f, \u043e\u043d\u0438 \u0431\u0443\u0434\u0443\u0442 \u043f\u0435\u0440\u0435\u043d\u0435\u0441\u0435\u043d\u044b \u0432 \u00ab\u041b\u0438\u0447\u043d\u043e\u0435\u00bb.";
const deleteFolderButtonLabel = "\u0423\u0434\u0430\u043b\u0438\u0442\u044c";
const cancelButtonLabel = "\u041e\u0442\u043c\u0435\u043d\u0430";
const folderDeletedMessage =
    "\u041f\u0430\u043f\u043a\u0430 \u0443\u0434\u0430\u043b\u0435\u043d\u0430";

function cleanNoteText(text: string | null) {
  return text === oldDefaultText ? "" : text || "";
}
function formatDateTime() {
  return new Date().toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const colorLabels: { value: NoteColor; label: string }[] = [
  { value: "default", label: "Обычный" },
  { value: "cyan", label: "Голубой" },
  { value: "violet", label: "Фиолетовый" },
  { value: "pink", label: "Розовый" },
  { value: "green", label: "Зелёный" },
  { value: "orange", label: "Оранжевый" },
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
        N+
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
      <div className="relative min-h-screen overflow-hidden bg-[#070b18] text-white">
        <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url("/bg-notes.png")' }}
        />

        <div className="absolute inset-0 bg-[#070b18]/80" />

        <main className="relative z-10 grid min-h-screen items-center gap-10 px-6 py-10 lg:grid-cols-2 lg:px-20">
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
              Создавай, закрепляй, раскрашивай и храни заметки.
            </p>
          </section>

          <section className="mx-auto w-full max-w-md rounded-[36px] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl">
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
                type="button"
                onClick={() => {
                  setMode("login");
                }}
                className="relative z-[9999] mt-5 w-full cursor-pointer rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-300"
            >
              Уже есть аккаунт? Войти
            </button>
          </section>
        </main>
      </div>
  );
}

export default function NotesApp() {
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState(allFoldersFilter);
  const [filter, setFilter] = useState(allNotesFilter);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
      "saved"
  );
  const [notice, setotice] = useState("");
  const [noticeType, setoticeType] = useState<"success" | "error">("success");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showNotice(message: string, type: "success" | "error" = "success") {
    setotice(message);
    setoticeType(type);

    setTimeout(() => {
      setotice("");
    }, 3000);
  }

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

    const rawNotes = (data || []) as Note[];
    const noteIds = rawNotes.map((note) => note.id);

    let imageRows: { note_id: number; image_url: string | null }[] = [];

    if (noteIds.length > 0) {
      const { data: imagesData, error: imagesError } = await supabase
          .from("note_images")
          .select("note_id, image_url")
          .in("note_id", noteIds)
          .order("created_at", { ascending: false });

      if (imagesError) {
        console.error("Ошибка загрузки изображений:", imagesError.message);
      } else {
        imageRows = (imagesData || []) as {
          note_id: number;
          image_url: string | null;
        }[];
      }

    }

    const imageByNoteId = new Map<number, string>();

    imageRows.forEach((image) => {
      if (!imageByNoteId.has(image.note_id) && image.image_url) {
        imageByNoteId.set(image.note_id, image.image_url);
      }
    });

    const cleanedNotes = rawNotes.map((note) => ({
      ...note,
      text: cleanNoteText(note.text),
      image_url: imageByNoteId.get(note.id) || note.image_url,
    }));

    setNotes(cleanedNotes);
    setSelectedId(cleanedNotes[0]?.id || null);
    setLoading(false);
  }, []);
  const loadFolders = useCallback(async (userId: string) => {
    const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true });

    if (error) {
      console.error("Ошибка загрузки папок:", error.message);
      return;
    }

    setFolders((data || []) as Folder[]);
  }, []);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);

      if (data.user) {
        void loadNotes(data.user.id);
        void loadFolders(data.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          const currentUser = session?.user || null;

          setUser(currentUser);

          if (currentUser) {
            void loadNotes(currentUser.id);
            void loadFolders(currentUser.id);
          } else {
            setNotes([]);
            setFolders([]);
            setSelectedId(null);
          }
        }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [loadNotes, loadFolders]);
  const visibleNotes = useMemo(() => {
    return notes
        .filter((note) => {
          const q = search.toLowerCase();
          const noteText = cleanNoteText(note.text);
          const isTrashFilter = filter === trashFilter;
          const isDeleted = Boolean(note.deleted);

          const matchesSearch =
              !q ||
              note.title?.toLowerCase().includes(q) ||
              noteText.toLowerCase().includes(q);

          const matchesMainFilter =
              filter === allNotesFilter ||
              (filter === pinnedFilter && note.pinned) ||
              (filter === favoriteFilter && note.favorite) ||
              (filter === archiveFilter && note.archived) ||
              isTrashFilter;

          const matchesFolderFilter =
              folderFilter === allFoldersFilter || note.folder === folderFilter;

          return (
              matchesSearch &&
              matchesMainFilter &&
              matchesFolderFilter &&
              (isTrashFilter ? isDeleted : !isDeleted)
          );
        })
        .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [notes, search, filter, folderFilter]);
  const selectedNote =
      visibleNotes.find((note) => note.id === selectedId) || visibleNotes[0] || null;
  async function ensureFolder(
      noteId: number,
      folderName: string
  ) {
    if (!user) return null;

    const finalFolderName = folderName.trim() || "Личное";

    const { data: folderData } = await supabase
        .from("folders")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", finalFolderName)
        .maybeSingle();

    let folderId = folderData?.id;

    if (!folderId) {
      const { data: createdFolder, error: folderError } = await supabase
          .from("folders")
          .insert({
            user_id: user.id,
            name: finalFolderName,
          })
          .select("id")
          .single();

      if (folderError) {
        showNotice("Ошибка создания папки: " + folderError.message, "error");
        return null;
      }

      folderId = createdFolder.id;
    }

    const { error: noteError } = await supabase
        .from("notes")
        .update({
          folder_id: folderId,
          folder: finalFolderName,
        })
        .eq("id", noteId);

    if (noteError) {
      showNotice("Ошибка обновления папки: " + noteError.message, "error");
      return null;
    }

    return { folderId, folderName: finalFolderName };
  }
  async function createNote(
      options: {
        title?: string;
        folder?: string;
        pinned?: boolean;
        color?: NoteColor;
      } = {}
  ) {
    if (!user) return;

    const newNote = {
      user_id: user.id,
      title: options.title || "Новая заметка",
      text: "",
      folder: options.folder || "Личное",
      date: formatDateTime(),
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
      showNotice("Ошибка создания заметки: " + error.message, "error");
      return;
    }
    const organization = await ensureFolder(
        (data as Note).id,
        newNote.folder
    );
    const createdNote = {
      ...(data as Note),
      folder_id: organization?.folderId || (data as Note).folder_id,
      folder: organization?.folderName || newNote.folder,
      deleted: false,
    };

    if (user) {
      void loadFolders(user.id);
    }

    setNotes((prev) => [createdNote, ...prev]);
    setSelectedId((data as Note).id);
    setQuickMenuOpen(false);
    showNotice("Заметка создана", "success");
  }

  function updateSelected(
      field: "title" | "text" | "date" | "color",
      value: string
  ) {
    if (!selectedNote) return;

    const noteId = selectedNote.id;
    const updatedDate = formatDateTime();

    setSaveStatus("saving");

    setNotes((prev) =>
        prev.map((note) =>
            note.id === noteId
                ? ({ ...note, [field]: value, date: updatedDate } as Note)
                : note
        )
    );


    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      const { error } = await supabase
          .from("notes")
          .update({ [field]: value, date: updatedDate })
          .eq("id", noteId);

      setSaveStatus(error ? "error" : "saved");
    }, 700);
  }

  async function updateSelectedOrganization(
      value: string
  ) {
    if (!selectedNote || !user) return;

    const organization = await ensureFolder(
        selectedNote.id,
        value
    );

    if (!organization) return;

    setNotes((prev) =>
        prev.map((note) =>
            note.id === selectedNote.id
                ? {
                  ...note,
                  folder_id: organization.folderId,
                  folder: organization.folderName,
                  date: formatDateTime(),
                }
                : note
        )
    );

    void loadFolders(user.id);
    showNotice(organizationUpdatedMessage, "success");
  }

  async function deleteFolder(folder: Folder) {
    if (!user || folder.name === defaultFolderName) return;

    const moveToDefault = {
      folder_id: null,
      folder: defaultFolderName,
    };

    const { error: folderIdError } = await supabase
        .from("notes")
        .update(moveToDefault)
        .eq("user_id", user.id)
        .eq("folder_id", folder.id);

    if (folderIdError) {
      showNotice(folderIdError.message, "error");
      return;
    }

    const { error: folderNameError } = await supabase
        .from("notes")
        .update(moveToDefault)
        .eq("user_id", user.id)
        .eq("folder", folder.name);

    if (folderNameError) {
      showNotice(folderNameError.message, "error");
      return;
    }

    const { error: deleteError } = await supabase
        .from("folders")
        .delete()
        .eq("id", folder.id)
        .eq("user_id", user.id);

    if (deleteError) {
      showNotice(deleteError.message, "error");
      return;
    }

    setNotes((prev) =>
        prev.map((note) =>
            note.folder_id === folder.id || note.folder === folder.name
                ? { ...note, folder_id: null, folder: defaultFolderName }
                : note
        )
    );
    setFolders((prev) => prev.filter((item) => item.id !== folder.id));

    if (folderFilter === folder.name) {
      setFolderFilter(allFoldersFilter);
    }

    setFolderToDelete(null);
    showNotice(folderDeletedMessage, "success");
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
      showNotice("Ошибка загрузки изображения: " + uploadError.message, "error");
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
      showNotice("Ошибка сохранения изображения: " + error.message, "error");
      return;
    }

    const { error: imageTableError } = await supabase
        .from("note_images")
        .insert({
          note_id: selectedNote.id,
          image_url: publicUrl,
        });

    if (imageTableError) {
      showNotice(
          "Ошибка записи изображения в новую таблицу: " + imageTableError.message,
          "error"
      );
      return;
    }

    setNotes((prev) =>
        prev.map((note) =>
            note.id === selectedNote.id ? { ...note, image_url: publicUrl } : note
        )
    );

    showNotice("Изображение загружено", "success");
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

    showNotice(
        nextValue ? "Добавлено в избранное" : "Убрано из избранного",
        "success"
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

    showNotice(
        nextValue ? "Заметка перемещена в архив" : "Заметка возвращена из архива",
        "success"
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

    showNotice(
        nextValue ? "Заметка закреплена" : "Заметка откреплена",
        "success"
    );
  }

  async function deleteSelected() {
    if (!selectedNote) return;

    if (selectedNote.deleted) {
      await permanentlyDeleteSelected();
      return;
    }

    const { error } = await supabase
        .from("notes")
        .update({ deleted: true })
        .eq("id", selectedNote.id);

    if (error) {
      showNotice(error.message, "error");
      return;
    }

    const updated = notes.map((note) =>
        note.id === selectedNote.id ? { ...note, deleted: true } : note
    );
    const nextVisible = updated.filter((note) =>
        filter === trashFilter ? note.deleted : !note.deleted
    );

    setNotes(updated);
    setSelectedId(nextVisible[0]?.id || null);
    setDeleteModalOpen(false);
    showNotice(movedToTrashMessage, "success");
  }

  async function restoreSelected() {
    if (!selectedNote) return;

    const { error } = await supabase
        .from("notes")
        .update({ deleted: false })
        .eq("id", selectedNote.id);

    if (error) {
      showNotice(error.message, "error");
      return;
    }

    const updated = notes.map((note) =>
        note.id === selectedNote.id ? { ...note, deleted: false } : note
    );
    const nextDeleted = updated.filter((note) => note.deleted);

    setNotes(updated);
    setSelectedId(filter === trashFilter ? nextDeleted[0]?.id || null : selectedNote.id);
    showNotice(restoredFromTrashMessage, "success");
  }

  async function permanentlyDeleteSelected() {
    if (!selectedNote) return;

    const { error } = await supabase.from("notes").delete().eq("id", selectedNote.id);

    if (error) {
      showNotice(error.message, "error");
      return;
    }

    const updated = notes.filter((note) => note.id !== selectedNote.id);

    setNotes(updated);
    setSelectedId(updated.find((note) => note.deleted)?.id || updated[0]?.id || null);
    setDeleteModalOpen(false);
    showNotice(permanentlyDeletedMessage, "success");
  }

  async function removeImage() {
    if (!selectedNote) return;

    const { error } = await supabase
        .from("notes")
        .update({ image_url: null })
        .eq("id", selectedNote.id);

    if (error) {
      showNotice("Ошибка удаления изображения: " + error.message, "error");
      return;
    }
    const { error: deleteImageTableError } = await supabase
        .from("note_images")
        .delete()
        .eq("note_id", selectedNote.id);

    if (deleteImageTableError) {
      showNotice(
          "Ошибка удаления изображения из новой таблицы: " + deleteImageTableError.message,
          "error"
      );
      return;
    }

    setNotes((prev) =>
        prev.map((note) =>
            note.id === selectedNote.id ? { ...note, image_url: null } : note
        )
    );
    showNotice("Изображение удалено", "success");
  }



  async function logout() {
    await supabase.auth.signOut();
  }

  const filters = [
    allNotesFilter,
    pinnedFilter,
    favoriteFilter,
    archiveFilter,
    trashFilter,
  ];

  const folderNames = Array.from(
      new Set([
        ...folders.map((folder) => folder.name),
        ...notes
            .map((note) => note.folder)
            .filter((folder): folder is string => Boolean(folder?.trim())),
      ])
  ).sort((a, b) => a.localeCompare(b, "ru"));

  function getFilterCount(filterame: string) {
    switch (filterame) {
      case allNotesFilter:
        return notes.filter((note) => !note.deleted).length;

      case pinnedFilter:
        return notes.filter((note) => note.pinned && !note.deleted).length;

      case favoriteFilter:
        return notes.filter((note) => note.favorite && !note.deleted).length;

      case archiveFilter:
        return notes.filter((note) => note.archived && !note.deleted).length;

      case trashFilter:
        return notes.filter((note) => note.deleted).length;

      default:
        return 0;
    }
  }

  if (!user) return <AuthScreen />;

  return (
      <div
          className={`relative min-h-screen overflow-hidden ${
              theme === "dark" ? "text-white" : "text-slate-900"
          }`}
      >
        <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url("/bg-notes.png")' }}
        />

        <div
            className={`absolute inset-0 ${
                theme === "dark" ? "bg-[#070b18]/80" : "bg-white/75"
            }`}
        />

        <div className="relative z-10">
          <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_420px_1fr]">
            <aside
                className={`border-b p-4 lg:border-b-0 lg:border-r lg:p-6 ${
                    theme === "dark"
                        ? "border-white/10 bg-white/[0.03]"
                        : "border-slate-200 bg-white"
                }`}
            >
              <div className="mb-5 flex items-center gap-3 lg:mb-8">
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

              <div className="grid grid-cols-2 gap-3 lg:block">
                <button
                    type="button"
                    onClick={logout}
                    className={`w-full rounded-2xl border px-5 py-3 transition lg:mb-4 ${
                        theme === "dark"
                            ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                            : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                    }`}
                >
                  Выйти
                </button>

                <button
                    type="button"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className={`mb-6 w-full rounded-2xl border px-5 py-3 transition lg:mb-8 ${
                        theme === "dark"
                            ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                            : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                    }`}
                >
                  {theme === "dark" ? "☀️ Светлая тема" : "🌙 Тёмная тема"}
                </button>
              </div>

              <p
                  className={`mb-3 text-sm ${
                      theme === "dark" ? "text-white/35" : "text-slate-400"
                  }`}
              >
                Фильтры
              </p>

              <div className="grid grid-cols-2 gap-2 lg:block lg:space-y-2">
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
        <div className="mt-8">
          <p
              className={`mb-3 text-sm ${
                  theme === "dark" ? "text-white/35" : "text-slate-400"
              }`}
          >
            Папки
          </p>

          <div className="space-y-2">
            {folders.length > 0 ? (
                folders.map((folder) => (
                    <div
                        key={folder.id}
                        className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-[0px] ${
                            theme === "dark"
                                ? "bg-white/5 text-white/65"
                                : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      <button
                          type="button"
                          onClick={() => setFolderFilter(folder.name)}
                          className="min-w-0 flex-1 truncate px-1 py-1 text-left text-sm"
                          title={folder.name}
                      >
                        {folder.name}
                      </button>

                      {folder.name !== defaultFolderName && (
                          <button
                              type="button"
                              onClick={() => setFolderToDelete(folder)}
                              title="Удалить папку"
                              aria-label="Удалить папку"
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base transition ${
                                  theme === "dark"
                                      ? "text-red-300 hover:bg-red-400/10"
                                      : "text-red-500 hover:bg-red-50"
                              }`}
                          >
                            ×
                          </button>
                      )}
                      📁 {folder.name}
                    </div>
                ))
            ) : (
                <p
                    className={`text-sm ${
                        theme === "dark" ? "text-white/30" : "text-slate-400"
                    }`}
                >
                  Папок пока нет
                </p>
            )}
          </div>
        </div>


              <div className="mt-6">
                <p
                    className={`mb-3 text-sm ${
                        theme === "dark" ? "text-white/35" : "text-slate-400"
                    }`}
                >
                  {foldersLabel}
                </p>

                <select
                    value={folderFilter}
                    onChange={(e) => setFolderFilter(e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                        theme === "dark"
                            ? "border-white/10 bg-black/20 text-white"
                            : "border-slate-200 bg-white text-slate-900"
                    }`}
                >
                  <option value={allFoldersFilter}>{allFoldersFilter}</option>
                  {folderNames.map((folderName) => (
                      <option key={folderName} value={folderName}>
                        {folderName}
                      </option>
                  ))}
                </select>
              </div>
            </aside>

            <section
                className={`border-b p-4 lg:border-b-0 lg:border-r lg:p-6 ${
                    theme === "dark"
                        ? "border-white/10 bg-black/20"
                        : "border-slate-200 bg-slate-50"
                }`}
            >
              <div className="mb-4">
                <h2 className="text-3xl font-black">Мои заметки</h2>

                <p
                    className={`mt-1 text-sm ${
                        theme === "dark" ? "text-white/40" : "text-slate-500"
                    }`}
                >
                  Найдено заметок: {visibleNotes.length}
                </p>
              </div>

              <div className="relative mb-6">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск заметок..."
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
                      ?
                    </button>
                )}
              </div>

              {loading ? (
                  <p
                      className={theme === "dark" ? "text-white/45" : "text-slate-500"}
                  >
                    Загрузка...
                  </p>
              ) : visibleNotes.length > 0 || search.trim().length > 0 || filter !== allNotesFilter ? (
                  <div className="space-y-4">
                    {visibleNotes.length === 0 && (
                        <div
                            className={`rounded-3xl border border-dashed p-6 text-center ${
                                theme === "dark"
                                    ? "border-white/10 bg-white/[0.03] text-white/45"
                                    : "border-slate-200 bg-white text-slate-500"
                            }`}
                        >
                          {search.trim().length > 0 || filter !== allNotesFilter ? (
                              <>
                                <p className="mb-3 font-bold">Ничего не найдено</p>

                                <p className="mb-4 text-sm">
                                  Попробуй изменить поиск или сбросить фильтры.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                      setSearch("");
                                      setFilter(allNotesFilter);
                                    }}
                                    className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-bold text-black transition hover:scale-[1.02]"
                                >
                                  Сбросить
                                </button>
                              </>
                          ) : (
                              <>
                                <p className="mb-4">Заметок пока нет</p>

                                <button
                                    type="button"
                                    onClick={() => createNote()}
                                    className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 font-bold text-black transition hover:scale-[1.02]"
                                >
                                  Создать первую заметку
                                </button>
                              </>
                          )}
                        </div>
                    )}
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
                                {note.pinned && "📌 "}
                                {note.title || "Без названия"}
                              </h3>

                              {note.favorite && (
                                  <span className="text-yellow-400">★</span>
                              )}
                            </div>

                            {note.image_url && (
                                <img
                                    src={note.image_url}
                                    alt="Картинка заметки"
                                    className="mb-4 h-28 w-full rounded-2xl object-cover"
                                />
                            )}

                            <p
                                className={`mb-4 line-clamp-2 text-sm ${
                                    theme === "dark" ? "text-white/55" : "text-slate-500"
                                }`}
                            >
                              {previewText || "Пустая заметка"}
                            </p>

                            <div
                                className={`flex justify-end text-xs ${
                                    theme === "dark" ? "text-white/40" : "text-slate-400"
                                }`}
                            >
                              <span>{note.date || "Без даты"}</span>
                            </div>
                          </button>
                      );
                    })}
                  </div>
              ) : (
                  <div
                      className={`flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed ${
                          theme === "dark"
                              ? "border-white/10 text-white/40"
                              : "border-slate-300 text-slate-400"
                      }`}
                  >
                    <p>Заметок пока нет</p>

                    <button
                        type="button"
                        onClick={() => createNote()}
                        className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 font-bold text-black transition hover:scale-[1.02]"
                    >
                      Создать первую заметку
                    </button>
                  </div>
              )}
            </section>

            <section className="p-4 lg:p-10">
              {selectedNote ? (
                  <div className="mx-auto max-w-4xl">
                    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row">
                      <div
                          className={
                            theme === "dark" ? "text-white/45" : "text-slate-500"
                          }
                      >
                        {saveStatus === "saving" && "💾 Сохранение..."}
                        {saveStatus === "saved" && "✅ Сохранено"}
                        {saveStatus === "error" && "⚠️ Ошибка сохранения"}
                      </div>

                      <div className="flex gap-3">
                        {selectedNote.deleted && (
                            <button
                                type="button"
                                title="Восстановить заметку"
                                aria-label="Восстановить заметку"
                                onClick={restoreSelected}
                                className="rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300 ring-1 ring-emerald-300/30 transition hover:bg-emerald-400/20"
                            >
                              Восстановить
                            </button>
                        )}

                        <button
                            type="button"
                            title={selectedNote.pinned ? "Открепить заметку" : "Закрепить заметку"}
                            aria-label={selectedNote.pinned ? "Открепить заметку" : "Закрепить заметку"}
                            onClick={() => togglePinned(selectedNote.id)}
                            className={`rounded-2xl p-3 transition ${
                                selectedNote.pinned
                                    ? "bg-cyan-400/20 text-cyan-300 ring-1 ring-cyan-300/40"
                                    : theme === "dark"
                                        ? "bg-white/5 hover:bg-white/10"
                                        : "bg-white shadow-sm hover:bg-slate-100"
                            }`}
                        >
                          📌
                        </button>

                        <button
                            type="button"
                            title={
                              selectedNote.favorite ? "Убрать из избранного" : "Добавить в избранное"
                            }
                            aria-label={
                              selectedNote.favorite ? "Убрать из избранного" : "Добавить в избранное"
                            }
                            onClick={() => toggleFavorite(selectedNote.id)}
                            className={`rounded-2xl p-3 transition ${
                                selectedNote.favorite
                                    ? "bg-yellow-400/20 text-yellow-300 ring-1 ring-yellow-300/40"
                                    : theme === "dark"
                                        ? "bg-white/5 hover:bg-white/10"
                                        : "bg-white shadow-sm hover:bg-slate-100"
                            }`}
                        >
                          ★
                        </button>

                        <button
                            type="button"
                            title={
                              selectedNote.archived ? "Вернуть из архива" : "Переместить в архив"
                            }
                            aria-label={
                              selectedNote.archived ? "Вернуть из архива" : "Переместить в архив"
                            }
                            onClick={() => toggleArchive(selectedNote.id)}
                            className={`rounded-2xl p-3 transition ${
                                selectedNote.archived
                                    ? "bg-violet-400/20 text-violet-300 ring-1 ring-violet-300/40"
                                    : theme === "dark"
                                        ? "bg-white/5 hover:bg-white/10"
                                        : "bg-white shadow-sm hover:bg-slate-100"
                            }`}
                        >
                          📦
                        </button>

                        <button
                            type="button"
                            title="Удалить заметку"
                            aria-label="Удалить заметку"
                            onClick={() => setDeleteModalOpen(true)}
                            className="rounded-2xl bg-red-400/10 p-3 text-red-400 transition hover:bg-red-400/20"
                        >
                          🗑
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
                          placeholder="Название заметки"
                          className={`mb-6 w-full bg-transparent text-3xl font-black outline-none lg:text-4xl ${
                              theme === "dark"
                                  ? "placeholder:text-white/25"
                                  : "placeholder:text-slate-300"
                          }`}
                      />

                      <div className="mb-6">
                        <div
                            className={`rounded-2xl border px-4 py-3 ${
                                theme === "dark"
                                    ? "border-white/10 bg-black/20 text-white"
                                    : "border-slate-200 bg-white text-slate-900"
                            }`}
                        >
                          <p
                              className={`mb-1 text-xs ${
                                  theme === "dark" ? "text-white/35" : "text-slate-400"
                              }`}
                          >
                            Последнее изменение
                          </p>

                          <p className="font-medium">
                            {selectedNote.date || "Дата не указана"}
                          </p>
                        </div>

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

                      <div className="mb-6 grid gap-4 md:grid-cols-2">
                        <label
                            className={`block rounded-2xl border px-4 py-3 ${
                                theme === "dark"
                                    ? "border-white/10 bg-black/20 text-white"
                                    : "border-slate-200 bg-white text-slate-900"
                            }`}
                        >
                          <span
                              className={`mb-2 block text-xs ${
                                  theme === "dark" ? "text-white/35" : "text-slate-400"
                              }`}
                          >
                            {folderLabel}
                          </span>

                          <input
                              value={selectedNote.folder || ""}
                              onChange={(e) => {
                                const nextFolder = e.target.value;

                                setNotes((prev) =>
                                    prev.map((note) =>
                                        note.id === selectedNote.id
                                            ? { ...note, folder: nextFolder }
                                            : note
                                    )
                                );
                              }}
                              onBlur={(e) =>
                                  void updateSelectedOrganization(e.currentTarget.value)
                              }
                              list="folder-options"
                              placeholder={defaultFolderName}
                              className="w-full bg-transparent outline-none"
                          />
                        </label>

                        <datalist id="folder-options">
                          {folderNames.map((folderName) => (
                              <option key={folderName} value={folderName} />
                          ))}
                        </datalist>
                      </div>

                      <textarea
                          value={cleanNoteText(selectedNote.text)}
                          onChange={(e) => updateSelected("text", e.target.value)}
                          placeholder="Напиши заметку..."
                          className={`min-h-[240px] w-full resize-none rounded-3xl border p-4 text-base outline-none lg:min-h-[320px] lg:p-5 lg:text-lg ${
                              theme === "dark"
                                  ? "border-white/10 bg-black/20 text-white placeholder:text-white/25"
                                  : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                          }`}
                      />
                      <div
                          className={`mt-3 flex justify-end text-xs ${
                              theme === "dark" ? "text-white/35" : "text-slate-400"
                          }`}
                      >
                        Символов: {cleanNoteText(selectedNote.text).length} · Слов:{" "}
                        {cleanNoteText(selectedNote.text).trim()
                            ? cleanNoteText(selectedNote.text).trim().split(/\s+/).length
                            : 0}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <label
                            className={`cursor-pointer rounded-2xl border px-5 py-3 text-sm transition ${
                                theme === "dark"
                                    ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            }`}
                        >
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
                        <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(cleanNoteText(selectedNote.text));
                              showNotice("Текст заметки скопирован", "success");
                            }}
                            className={`rounded-2xl border px-5 py-3 text-sm transition ${
                                theme === "dark"
                                    ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            }`}
                        >
                          📋 Скопировать текст
                        </button>

                        {selectedNote.image_url && (
                            <button
                                type="button"
                                onClick={removeImage}
                                className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm text-red-400"
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
                  <div
                      className={`flex h-full items-center justify-center ${
                          theme === "dark" ? "text-white/50" : "text-slate-400"
                      }`}
                  >
                    Создай первую заметку
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
                    🗑
                  </div>

                  <h3 className="mb-3 text-2xl font-black">Удалить заметку?</h3>

                  <p
                      className={`mb-6 leading-7 ${
                          theme === "dark" ? "text-white/55" : "text-slate-500"
                      }`}
                  >
                    Заметка «{selectedNote.title || "Без названия"}» будет удалена.
                    Это действие нельзя отменить.
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
                      Отмена
                    </button>

                    <button
                        type="button"
                        onClick={deleteSelected}
                        className="rounded-2xl bg-red-500 px-5 py-3 font-bold text-white transition hover:bg-red-600"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
          )}

          {folderToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                <div
                    className={`w-full max-w-md rounded-[32px] border p-7 shadow-2xl ${
                        theme === "dark"
                            ? "border-white/10 bg-[#10162a] text-white"
                            : "border-slate-200 bg-white text-slate-900"
                    }`}
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-2xl text-red-400">
                    ?
                  </div>

                  <h3 className="mb-3 text-2xl font-black">{deleteFolderTitle}</h3>

                  <p
                      className={`mb-6 leading-7 ${
                          theme === "dark" ? "text-white/55" : "text-slate-500"
                      }`}
                  >
                    {deleteFolderDescription}
                  </p>

                  <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => setFolderToDelete(null)}
                        className={`rounded-2xl border px-5 py-3 font-bold transition ${
                            theme === "dark"
                                ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      {cancelButtonLabel}
                    </button>

                    <button
                        type="button"
                        onClick={() => void deleteFolder(folderToDelete)}
                        className="rounded-2xl bg-red-500 px-5 py-3 font-bold text-white transition hover:bg-red-600"
                    >
                      {deleteFolderButtonLabel}
                    </button>
                  </div>
                </div>
              </div>
          )}

          {notice && (
              <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2">
                <div
                    className={`rounded-2xl border px-6 py-4 text-sm font-bold text-white shadow-2xl ${
                        noticeType === "error"
                            ? "border-red-400/20 bg-red-500/90"
                            : "border-emerald-400/20 bg-emerald-500/90"
                    }`}
                >
                  {notice}
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
                            title: "Новая заметка",
                          })
                      }
                      className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-lg transition ${
                          theme === "dark"
                              ? "bg-white text-slate-900 hover:bg-white/90"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                  >
                    Текстовая заметка
                  </button>

                  <button
                      type="button"
                      onClick={() =>
                          createNote({
                            title: "Важная заметка",
                            pinned: true,
                          })
                      }
                      className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-lg transition ${
                          theme === "dark"
                              ? "bg-white text-slate-900 hover:bg-white/90"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                  >
                    Закреплённая заметка
                  </button>

                  <button
                      type="button"
                      onClick={() =>
                          createNote({
                            title: "Проектная заметка",
                            folder: "Проекты",
                            color: "violet",
                          })
                      }
                      className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-lg transition ${
                          theme === "dark"
                              ? "bg-white text-slate-900 hover:bg-white/90"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                  >
                    Проектная заметка
                  </button>
                </div>
            )}

            <button
                type="button"
                onClick={() => setQuickMenuOpen(!quickMenuOpen)}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 text-3xl font-black text-white shadow-[0_0_35px_rgba(139,92,246,0.55)] transition hover:scale-105"
            >
              {quickMenuOpen ? "?" : "+"}
            </button>
          </div>
        </div>
      </div>
  );
}






