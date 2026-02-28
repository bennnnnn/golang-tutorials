import Avatar from "@/components/Avatar";

interface Props {
  name: string;
  email: string;
  bio: string;
  avatar: string;
  createdAt: string;
}

export default function ProfileHeader({ name, email, bio, avatar, createdAt }: Props) {
  const joinDate = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mb-10 flex items-start gap-6">
      <Avatar avatarKey={avatar} size="xl" />
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{name}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{email}</p>
        {bio && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{bio}</p>}
        <p className="mt-1 text-xs text-zinc-400">Joined {joinDate}</p>
      </div>
    </div>
  );
}
