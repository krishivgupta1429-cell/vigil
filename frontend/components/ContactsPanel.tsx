"use client";

import { useEffect, useState } from "react";
import { ApiError, contactsApi, type Contact } from "@/lib/api";
import { TrashIcon } from "./icons";

const inputClass =
  "w-full rounded-xl border border-edge bg-night px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-teal focus:outline-none";

function errorText(e: unknown) {
  return e instanceof ApiError ? e.message : "Something went wrong.";
}

export default function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [chatId, setChatId] = useState("");

  useEffect(() => {
    let cancelled = false;
    contactsApi
      .list()
      .then((list) => {
        if (!cancelled) {
          setContacts(list);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setContacts([]);
          setError(errorText(e));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const created = await contactsApi.create({
        name,
        phone: phone || undefined,
        telegram_chat_id: chatId || undefined,
      });
      setContacts((prev) => [...(prev ?? []), created]);
      setName("");
      setPhone("");
      setChatId("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setError(null);
    try {
      await contactsApi.remove(id);
      setContacts((prev) => (prev ?? []).filter((c) => c.id !== id));
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <section aria-labelledby="contacts-heading">
      <h2 id="contacts-heading" className="text-lg font-semibold">
        Trusted contacts
      </h2>
      <p className="mt-0.5 text-sm text-white/55">
        People who will be alerted if you need help.
      </p>

      <div className="mt-4 space-y-2">
        {contacts === null && <p className="text-sm text-white/45">Loading…</p>}
        {contacts?.length === 0 && !error && (
          <p className="rounded-2xl border border-dashed border-edge p-4 text-center text-sm text-white/45">
            No contacts yet. Add one below.
          </p>
        )}
        {contacts?.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-2xl border border-edge bg-card px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{c.name}</p>
              <p className="truncate text-xs text-white/50">
                {[c.phone, c.telegram_chat_id && `Telegram ${c.telegram_chat_id}`]
                  .filter(Boolean)
                  .join(" · ") || "No details"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(c.id)}
              aria-label={`Delete ${c.name}`}
              className="ml-3 rounded-full p-2 text-white/50 transition hover:text-rose active:scale-90"
            >
              <TrashIcon width={18} height={18} />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={add} className="mt-4 space-y-2.5 rounded-2xl border border-edge bg-card p-4">
        <input
          className={inputClass}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Contact name"
          required
        />
        <input
          className={inputClass}
          placeholder="Phone (optional)"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-label="Contact phone"
        />
        <input
          className={inputClass}
          placeholder="Telegram chat ID (optional)"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          aria-label="Telegram chat ID"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="w-full rounded-xl bg-teal py-2.5 text-sm font-semibold text-night transition active:scale-[0.98] disabled:opacity-40"
        >
          {busy ? "Adding…" : "Add contact"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-rose/15 px-3.5 py-2.5 text-sm text-rose">
          {error}
        </p>
      )}
    </section>
  );
}
