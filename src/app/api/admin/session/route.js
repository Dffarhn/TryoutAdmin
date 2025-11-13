import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminById } from "@/lib/adminAuth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get("admin_id")?.value;

    if (!adminId) {
      return NextResponse.json({ data: null });
    }

    const admin = await getAdminById(adminId);

    if (!admin) {
      // Clear invalid cookie
      cookieStore.delete("admin_id");
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ 
      data: {
        ...admin,
        is_super_admin: admin.is_super_admin,
        isSuperAdmin: admin.is_super_admin, // For compatibility
      }
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ data: null });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_id");
    return NextResponse.json({ message: "Logout berhasil" });
  } catch (error) {
    return NextResponse.json(
      { error: "Logout gagal" },
      { status: 500 }
    );
  }
}

