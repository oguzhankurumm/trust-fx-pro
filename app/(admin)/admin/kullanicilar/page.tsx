import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Kullanıcılar | Admin" };

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}

const PAGE_SIZE = 25;

export default async function KullanicilarPage({ searchParams }: Props) {
  const { page: pageStr, q: search } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { ledgerEntries: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Kullanıcılar</h1>
          <p className="text-text-muted text-sm">Toplam {total} kullanıcı</p>
        </div>
        <form method="GET" className="flex gap-2">
          <input
            name="q"
            defaultValue={search}
            placeholder="E-posta veya isim ara..."
            className="px-3 py-2 rounded-xl border border-border bg-bg-elevated text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 w-56"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-brand/10 border border-brand/30 text-brand text-sm hover:bg-brand/20 transition-colors"
          >
            Ara
          </button>
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="py-3 px-4 text-left text-xs text-text-muted font-medium">E-posta</th>
                  <th className="py-3 px-4 text-left text-xs text-text-muted font-medium">İsim</th>
                  <th className="py-3 px-4 text-center text-xs text-text-muted font-medium">Rol</th>
                  <th className="py-3 px-4 text-center text-xs text-text-muted font-medium">Durum</th>
                  <th className="py-3 px-4 text-center text-xs text-text-muted font-medium">İşlem</th>
                  <th className="py-3 px-4 text-left text-xs text-text-muted font-medium">Kayıt</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-bg-elevated/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-text-primary">{u.email}</td>
                    <td className="py-3 px-4 text-text-secondary">{u.name ?? "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={u.role === "ADMIN" ? "danger" : "default"}>
                        {u.role === "ADMIN" ? "Admin" : "Kullanıcı"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={u.status === "ACTIVE" ? "approved" : "rejected"}>
                        {u.status === "ACTIVE" ? "Aktif" : "Engellendi"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center text-text-muted">{u._count.ledgerEntries}</td>
                    <td className="py-3 px-4 text-text-muted">{formatDate(u.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/kullanicilar/${u.id}`}
                        className="text-brand text-xs hover:underline"
                      >
                        Detay →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`?page=${p}${search ? `&q=${search}` : ""}`}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    p === page
                      ? "bg-brand/10 text-brand border-brand/30"
                      : "border-border text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
