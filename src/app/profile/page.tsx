import type { Metadata } from "next";
import { Kicker, Badge } from "@/components/ui";
import { withUser } from "@/components/RequireAuth";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  return withUser((user) => (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <Kicker>Account</Kicker>
          <h1 className="mt-2 font-display text-4xl">{user.displayName}</h1>
        </div>
        <Badge tone={user.isPremium ? "accent" : "default"}>
          {user.isPremium ? "Premium" : "Free"}
        </Badge>
      </div>
      <div className="mt-8">
        <ProfileForm
          initial={{
            displayName: user.displayName,
            username: user.username,
            dailyGoalMin: user.dailyGoalMin,
            timezone: user.timezone,
            email: user.email,
            plan: user.plan,
          }}
        />
      </div>
    </div>
  ));
}
