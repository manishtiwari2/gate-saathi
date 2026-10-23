import type { Metadata } from "next";
import { withUser } from "@/components/RequireAuth";
import { StorageClient } from "./StorageClient";

export const metadata: Metadata = { title: "My Storage" };

export default async function StoragePage() {
  return withUser(() => (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <StorageClient />
    </div>
  ));
}
