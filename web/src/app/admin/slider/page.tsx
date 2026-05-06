"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { fetchStoreData, upsertSliderPhotos } from "@/lib/api";
import { SliderPhoto } from "@/lib/store";

type SliderPhotoForm = SliderPhoto & {
  fileName?: string;
};

function compressSliderPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas is not available"));
        return;
      }

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };

    image.src = objectUrl;
  });
}

export default function AdminSliderPage() {
  const [photos, setPhotos] = useState<SliderPhotoForm[]>([]);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void fetchStoreData().then((data) => {
      if (!isMounted) return;
      setPhotos((data.sliderPhotos ?? []).map((item, index) => ({ ...item, position: index })));
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const onPhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const nextPhotos: SliderPhotoForm[] = [];
    for (const file of files) {
      try {
        const imageUrl = await compressSliderPhoto(file);
        nextPhotos.push({
          id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          title: file.name.replace(/\.[^.]+$/, ""),
          imageUrl,
          position: photos.length + nextPhotos.length,
          fileName: file.name
        });
      } catch {
        setStatus("Не удалось прочитать один из файлов.");
      }
    }

    if (nextPhotos.length) {
      setPhotos((prev) => [...prev, ...nextPhotos].map((item, index) => ({ ...item, position: index })));
      setStatus("");
    }
    e.target.value = "";
  };

  const updatePhoto = (id: string, patch: Partial<SliderPhotoForm>) => {
    setPhotos((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const replacePhotoImage = (id: string) => async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imageUrl = await compressSliderPhoto(file);
      updatePhoto(id, { imageUrl, fileName: file.name });
      setStatus("");
    } catch {
      setStatus("Не удалось заменить фото.");
    }
    e.target.value = "";
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((item) => item.id !== id).map((item, index) => ({ ...item, position: index })));
  };

  const movePhoto = (id: string, direction: -1 | 1) => {
    setPhotos((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy.map((photo, position) => ({ ...photo, position }));
    });
  };

  const savePhotos = async () => {
    setIsSaving(true);
    setStatus("");
    try {
      const payload = photos.map((item, index) => ({
        id: item.id.startsWith("new-") ? "" : item.id,
        title: item.title?.trim() || undefined,
        imageUrl: item.imageUrl,
        position: index
      }));
      const saved = await upsertSliderPhotos(payload);
      setPhotos(saved.map((item, index) => ({ ...item, position: index })));
      setStatus("Слайдер сохранен.");
    } catch {
      setStatus("Не удалось сохранить слайдер. Проверьте API и размер фото.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 px-6 py-8 text-zinc-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Слайдер фото</h1>
            <p className="text-sm text-zinc-500">Загрузите фото, измените подписи и порядок отображения на главной.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700">
              Товары
            </Link>
            <Link href="/" className="rounded-xl bg-zinc-900 px-4 py-2 text-white">
              На сайт
            </Link>
          </div>
        </div>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Фото для слайдера</h2>
              <p className="text-sm text-zinc-500">На сайте одновременно видно 5 фото, центральное выделяется размером.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
              Загрузить фото
              <input type="file" accept="image/*" multiple className="hidden" onChange={onPhotoUpload} />
            </label>
          </div>

          {photos.length ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {photos.map((photo, index) => (
                <article key={photo.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.imageUrl} alt={photo.title ?? "Фото слайдера"} className="h-44 w-full rounded-xl object-cover" />
                  <div className="mt-3 space-y-2">
                    <input
                      className="field"
                      placeholder="Подпись фото"
                      value={photo.title ?? ""}
                      onChange={(e) => updatePhoto(photo.id, { title: e.target.value })}
                    />
                    <p className="text-xs text-zinc-500">
                      Позиция: {index + 1}
                      {photo.fileName ? ` · ${photo.fileName}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                        onClick={() => movePhoto(photo.id, -1)}
                        disabled={index === 0}
                      >
                        Выше
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                        onClick={() => movePhoto(photo.id, 1)}
                        disabled={index === photos.length - 1}
                      >
                        Ниже
                      </button>
                      <label className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700">
                        Заменить
                        <input type="file" accept="image/*" className="hidden" onChange={replacePhotoImage(photo.id)} />
                      </label>
                      <button
                        type="button"
                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600"
                        onClick={() => removePhoto(photo.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
              Фото еще не загружены. Добавьте минимум 5 фото, чтобы слайдер выглядел полноценно.
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button type="button" className="btn-primary disabled:opacity-60" onClick={savePhotos} disabled={isSaving}>
              {isSaving ? "Сохраняем..." : "Сохранить слайдер"}
            </button>
            {status ? <p className="text-sm text-zinc-600">{status}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
