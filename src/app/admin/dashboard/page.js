"use client";

import Link from "next/link";
import {
  BookOpen,
  Package,
  FolderTree,
  FileQuestion,
  Layers,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  Target,
} from "lucide-react";
import { useTryouts } from "@/hooks/useTryouts";
import {
  useDashboardStats,
  useDashboardMetrics,
  useRecentAttempts,
  useRecentActivities,
  useDashboardHealth,
} from "@/hooks/useDashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Stat Card Component
function StatCard({ title, value, icon: Icon, color = "gray", link }) {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {Icon && (
          <Icon
            className={`w-4 h-4 ${
              color === "green"
                ? "text-green-600"
                : color === "blue"
                ? "text-blue-600"
                : color === "orange"
                ? "text-orange-600"
                : "text-gray-600"
            }`}
          />
        )}
      </CardHeader>
      <CardContent>
        <p
          className={`text-3xl font-bold ${
            color === "green"
              ? "text-green-600"
              : color === "blue"
              ? "text-blue-600"
              : color === "orange"
              ? "text-orange-600"
              : "text-gray-900"
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }

  return content;
}

export default function DashboardPage() {
  const { data: tryouts, isLoading: tryoutsLoading } = useTryouts();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: recentAttempts, isLoading: attemptsLoading } =
    useRecentAttempts();
  const { data: recentActivities, isLoading: activitiesLoading } =
    useRecentActivities();
  const { data: health, isLoading: healthLoading } = useDashboardHealth();

  const isLoading =
    tryoutsLoading ||
    statsLoading ||
    metricsLoading ||
    attemptsLoading ||
    activitiesLoading ||
    healthLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Ringkasan dan statistik sistem tryout
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/tryouts/new">
            <Button variant="secondary" className="text-sm">
              + Tryout
            </Button>
          </Link>
          <Link href="/admin/packages/new">
            <Button variant="secondary" className="text-sm">
              + Paket
            </Button>
          </Link>
          <Link href="/admin/categories/new">
            <Button variant="secondary" className="text-sm">
              + Kategori
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Total Tryout"
          value={stats?.tryouts?.total || 0}
          icon={BookOpen}
          color="blue"
          link="/admin/tryouts"
        />
        <StatCard
          title="Total Paket"
          value={stats?.packages?.total || 0}
          icon={Package}
          color="blue"
          link="/admin/packages"
        />
        <StatCard
          title="Total Kategori"
          value={stats?.categories || 0}
          icon={FolderTree}
          color="blue"
          link="/admin/categories"
        />
        <StatCard
          title="Total Soal"
          value={stats?.questions || 0}
          icon={FileQuestion}
          color="gray"
        />
        <StatCard
          title="Total Sub-Bab"
          value={stats?.subChapters || 0}
          icon={Layers}
          color="gray"
        />
        <StatCard
          title="Total Attempts"
          value={stats?.attempts?.total || 0}
          icon={Target}
          color="green"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rata-rata Skor
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {metrics?.averageScore?.toFixed(1) || "0.0"}
            </p>
            <p className="text-xs text-gray-500 mt-1">dari semua attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completion Rate
            </CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {metrics?.completionRate?.toFixed(1) || "0.0"}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.attempts?.completed || 0} dari {stats?.attempts?.total || 0}{" "}
              attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rata-rata Durasi
            </CardTitle>
            <Clock className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {metrics?.averageDuration || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">menit per attempt</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Attempts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Attempts</CardTitle>
              <Link href="/admin/tryouts">
                <Button variant="ghost" className="text-sm">
                  Lihat Semua →
                </Button>
              </Link>
            </div>
            <CardDescription>
              {recentAttempts?.length || 0} attempts terbaru
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAttempts?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Belum ada attempts
              </p>
            ) : (
              <div className="space-y-3">
                {recentAttempts?.slice(0, 5).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {attempt.userName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {attempt.tryoutTitle}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {attempt.completedAt
                          ? new Date(attempt.completedAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "In Progress"}
                      </p>
                    </div>
                    <div className="text-right">
                      {attempt.completedAt ? (
                        <>
                          <p className="text-lg font-bold text-blue-600">
                            {attempt.score}
                          </p>
                          <p className="text-xs text-gray-500">
                            {attempt.duration} menit
                          </p>
                        </>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Admin Activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activities</CardTitle>
              <Activity className="w-4 h-4 text-gray-400" />
            </div>
            <CardDescription>
              {recentActivities?.length || 0} aktivitas terbaru
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Belum ada aktivitas
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivities?.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {activity.adminName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            activity.actionType === "CREATE"
                              ? "bg-green-100 text-green-700"
                              : activity.actionType === "UPDATE"
                              ? "bg-blue-100 text-blue-700"
                              : activity.actionType === "DELETE"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {activity.actionType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {activity.resourceType}: {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.createdAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health Check Warnings */}
      {health?.warnings && health.warnings.length > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <CardTitle className="text-yellow-900">Health Check</CardTitle>
            </div>
            <CardDescription className="text-yellow-700">
              Perhatian: Ada beberapa data yang perlu diperbaiki
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health.warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-900">
                      {warning.message}
                    </span>
                  </div>
                  {warning.type === "tryout_no_subchapters" &&
                    warning.tryoutIds?.length > 0 && (
                      <Link
                        href={`/admin/tryouts/${warning.tryoutIds[0]}/edit`}
                      >
                        <Button variant="secondary" className="text-xs">
                          Perbaiki
                        </Button>
                      </Link>
                    )}
                  {warning.type === "tryout_no_questions" &&
                    warning.tryoutIds?.length > 0 && (
                      <Link
                        href={`/admin/tryouts/${warning.tryoutIds[0]}/questions`}
                      >
                        <Button variant="secondary" className="text-xs">
                          Tambah Soal
                        </Button>
                      </Link>
                    )}
                  {warning.type === "package_no_tryouts" && (
                    <Link href="/admin/packages">
                      <Button variant="secondary" className="text-xs">
                        Lihat Paket
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tryout Terbaru (Existing) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tryout Terbaru</CardTitle>
            <Link href="/admin/tryouts">
              <Button variant="ghost" className="text-sm">
                Lihat Semua →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {tryouts?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Belum ada tryout.{" "}
              <Link
                href="/admin/tryouts/new"
                className="text-indigo-600 hover:underline"
              >
                Buat tryout pertama
              </Link>
            </p>
          ) : (
            <div className="space-y-2">
              {tryouts?.slice(0, 5).map((tryout) => (
                <div
                  key={tryout.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <Link
                      href={`/admin/tryouts/${tryout.id}/edit`}
                      className="font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {tryout.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      {tryout.packageName || "-"}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tryout.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tryout.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
