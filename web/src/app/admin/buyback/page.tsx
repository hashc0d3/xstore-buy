"use client";

import Link from "next/link";
import { KeyboardEvent, useEffect, useState } from "react";
import { fetchBuybackConfig, upsertBuybackConfig } from "@/lib/api";
import { BuybackConfig, defaultStoreData } from "@/lib/store";

type OptionKey = keyof Pick<BuybackConfig, "models" | "memories" | "simTypes">;

const fallbackConfig: BuybackConfig = defaultStoreData.buybackConfig ?? {
  models: [],
  memories: [],
  simTypes: [],
  conditions: []
};

function OptionManager({
  title,
  placeholder,
  keyName,
  value,
  onChangeValue,
  options,
  editingItem,
  onEnterAdd,
  onAddCurrent,
  onStartEdit,
  onEditValueChange,
  onSaveEdit,
  onCancelEdit,
  onRemoveOption
}: {
  title: string;
  placeholder: string;
  keyName: OptionKey;
  value: string;
  onChangeValue: (next: string) => void;
  options: string[];
  editingItem: { key: OptionKey; index: number; value: string } | null;
  onEnterAdd: (event: KeyboardEvent<HTMLInputElement>, action: () => void) => void;
  onAddCurrent: () => void;
  onStartEdit: (key: OptionKey, index: number, value: string) => void;
  onEditValueChange: (next: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemoveOption: (key: OptionKey, index: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-sm font-semibold text-zinc-800">{title}</p>
      <div className="flex gap-2">
        <input
          className="field"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChangeValue(e.target.value)}
          onKeyDown={(e) => onEnterAdd(e, onAddCurrent)}
        />
        <button type="button" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" onClick={onAddCurrent}>
          Добавить
        </button>
      </div>

      {options.length ? (
        <div className="space-y-2">
          {options.map((item, index) => {
            const isEditing = editingItem?.key === keyName && editingItem.index === index;
            return (
              <div key={`${keyName}-${index}-${item}`} className="rounded-lg border border-zinc-200 bg-white p-2.5">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      className="field"
                      value={editingItem.value}
                      onChange={(e) => onEditValueChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        onSaveEdit();
                      }}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700"
                        onClick={onCancelEdit}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-emerald-200 px-2 py-1 text-xs text-emerald-700"
                        onClick={onSaveEdit}
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-800">{item}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700"
                        onClick={() => onStartEdit(keyName, index, item)}
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600"
                        onClick={() => onRemoveOption(keyName, index)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-zinc-500">Список пуст. Добавьте хотя бы одно значение.</p>
      )}
    </div>
  );
}

export default function AdminBuybackPage() {
  const [config, setConfig] = useState<BuybackConfig>(fallbackConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newModel, setNewModel] = useState("");
  const [newMemory, setNewMemory] = useState("");
  const [newSimType, setNewSimType] = useState("");
  const [editingItem, setEditingItem] = useState<{
    key: OptionKey;
    index: number;
    value: string;
  } | null>(null);

  useEffect(() => {
    void fetchBuybackConfig()
      .then((remote) => setConfig(remote))
      .finally(() => setLoading(false));
  }, []);

  const addOption = (key: OptionKey, rawValue: string) => {
    const value = rawValue.trim();
    if (!value) return;
    setConfig((prev) => {
      const current = prev[key];
      if (current.includes(value)) return prev;
      return { ...prev, [key]: [...current, value] };
    });
  };

  const removeOption = (key: OptionKey, index: number) => {
    setConfig((prev) => ({ ...prev, [key]: prev[key].filter((_, idx) => idx !== index) }));
    if (editingItem && editingItem.key === key && editingItem.index === index) {
      setEditingItem(null);
    }
  };

  const startEditOption = (
    key: OptionKey,
    index: number,
    value: string
  ) => {
    setEditingItem({ key, index, value });
  };

  const saveEditOption = () => {
    if (!editingItem) return;
    const value = editingItem.value.trim();
    if (!value) return;
    setConfig((prev) => {
      const current = prev[editingItem.key];
      const next = current.map((item, index) => (index === editingItem.index ? value : item));
      return { ...prev, [editingItem.key]: Array.from(new Set(next)) };
    });
    setEditingItem(null);
  };

  const onEnterAdd = (event: KeyboardEvent<HTMLInputElement>, action: () => void) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    action();
  };

  const save = async () => {
    setNotice(null);
    if (!config.models.length || !config.memories.length || !config.simTypes.length) {
      setNotice({ type: "error", text: "Заполните все списки: тип устройства, память и тип SIM." });
      return;
    }
    try {
      setSaving(true);
      await upsertBuybackConfig(config);
      setNotice({ type: "success", text: "Настройки выкупа сохранены." });
    } catch {
      setNotice({ type: "error", text: "Не удалось сохранить настройки." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-8 text-zinc-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold">Админка Sotik77</h1>
            <p className="text-sm text-zinc-500">Страница "Выкуп"</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700">
              Каталог
            </Link>
            <Link href="/" className="rounded-xl bg-zinc-900 px-4 py-2 text-white">
              На сайт
            </Link>
          </div>
        </div>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          {loading ? (
            <p className="text-sm text-zinc-500">Загрузка...</p>
          ) : (
            <div className="space-y-4">
              <OptionManager
                title="Тип устройства"
                keyName="models"
                value={newModel}
                onChangeValue={setNewModel}
                placeholder="Например, iPhone 15 Pro Max"
                options={config.models}
                editingItem={editingItem}
                onEnterAdd={onEnterAdd}
                onAddCurrent={() => {
                  addOption("models", newModel);
                  setNewModel("");
                }}
                onStartEdit={startEditOption}
                onEditValueChange={(next) => setEditingItem((prev) => (prev ? { ...prev, value: next } : prev))}
                onSaveEdit={saveEditOption}
                onCancelEdit={() => setEditingItem(null)}
                onRemoveOption={removeOption}
              />
              <OptionManager
                title="Объем памяти"
                keyName="memories"
                value={newMemory}
                onChangeValue={setNewMemory}
                placeholder="Например, 256 ГБ"
                options={config.memories}
                editingItem={editingItem}
                onEnterAdd={onEnterAdd}
                onAddCurrent={() => {
                  addOption("memories", newMemory);
                  setNewMemory("");
                }}
                onStartEdit={startEditOption}
                onEditValueChange={(next) => setEditingItem((prev) => (prev ? { ...prev, value: next } : prev))}
                onSaveEdit={saveEditOption}
                onCancelEdit={() => setEditingItem(null)}
                onRemoveOption={removeOption}
              />
              <OptionManager
                title="Тип SIM"
                keyName="simTypes"
                value={newSimType}
                onChangeValue={setNewSimType}
                placeholder="Например, eSIM + nano-SIM"
                options={config.simTypes}
                editingItem={editingItem}
                onEnterAdd={onEnterAdd}
                onAddCurrent={() => {
                  addOption("simTypes", newSimType);
                  setNewSimType("");
                }}
                onStartEdit={startEditOption}
                onEditValueChange={(next) => setEditingItem((prev) => (prev ? { ...prev, value: next } : prev))}
                onSaveEdit={saveEditOption}
                onCancelEdit={() => setEditingItem(null)}
                onRemoveOption={removeOption}
              />

              {notice ? (
                <p className={`text-sm font-medium ${notice.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{notice.text}</p>
              ) : null}

              <button type="button" className="btn-primary disabled:opacity-70" onClick={save} disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить настройки выкупа"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
