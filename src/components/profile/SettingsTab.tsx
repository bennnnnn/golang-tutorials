"use client";

import { useState } from "react";
import Avatar, { AVATAR_KEYS } from "@/components/Avatar";
import type { Profile } from "./types";

interface Props {
  profile: Profile;
  onSave: (data: { name: string; bio: string; avatar: string; theme: string }) => Promise<boolean>;
  onChangePassword: (currentPw: string, newPw: string) => Promise<string | null>;
  onDeleteAccount: () => Promise<void>;
}

export default function SettingsTab({ profile, onSave, onChangePassword, onDeleteAccount }: Props) {
  const [editName, setEditName] = useState(profile.name);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editAvatar, setEditAvatar] = useState(profile.avatar);
  const [editTheme] = useState(profile.theme);

  const [saving, setSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSettingsMsg("");
    try {
      const ok = await onSave({ name: editName, bio: editBio, avatar: editAvatar, theme: editTheme });
      if (ok) setSettingsMsg("Profile saved!");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setChangingPw(true);
    setPwMsg("");
    try {
      const err = await onChangePassword(currentPw, newPw);
      if (err === null) {
        setPwMsg("Password changed!");
        setCurrentPw("");
        setNewPw("");
      } else {
        setPwMsg(err);
      }
    } finally {
      setChangingPw(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDeleteAccount();
    // No need to reset — page will redirect
  };

  return (
    <div className="space-y-8">
      {/* Profile settings */}
      <section>
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Bio</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              maxLength={200}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="Tell us about yourself..."
            />
            <p className="mt-1 text-xs text-zinc-400">{editBio.length}/200</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Avatar</label>
            <div className="flex flex-wrap gap-3">
              {AVATAR_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setEditAvatar(key)}
                  className={`rounded-full ring-2 ring-offset-2 transition-all ${
                    editAvatar === key
                      ? "ring-cyan-500"
                      : "ring-transparent hover:ring-zinc-300 dark:hover:ring-zinc-600"
                  }`}
                >
                  <Avatar avatarKey={key} size="md" />
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {settingsMsg && <p className="text-sm text-green-600">{settingsMsg}</p>}
        </div>
      </section>

      {/* Password */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Password</h3>
          <button
            onClick={() => {
              setShowPwForm(!showPwForm);
              setCurrentPw("");
              setNewPw("");
              setPwMsg("");
            }}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {showPwForm ? "Cancel" : "Change Password"}
          </button>
        </div>
        {showPwForm && (
          <div className="mt-4 space-y-3">
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Current password"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password (min. 6 characters)"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              onClick={handleChangePassword}
              disabled={!currentPw || newPw.length < 6 || changingPw}
              className="rounded-lg bg-zinc-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {changingPw ? "Updating..." : "Update Password"}
            </button>
            {pwMsg && (
              <p className={`text-sm ${pwMsg === "Password changed!" ? "text-green-600" : "text-red-500"}`}>{pwMsg}</p>
            )}
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section>
        <h3 className="mb-4 text-lg font-semibold text-red-600">Danger Zone</h3>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="rounded-lg border border-red-300 px-6 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
          >
            Delete Account
          </button>
        ) : (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <p className="mb-3 text-sm text-red-700 dark:text-red-400">
              This will permanently delete your account and all data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete My Account"}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
