import { NextResponse } from "next/server";
import { loginAdmin } from "@/lib/adminAuth";
import { logAdminActivity, getRequestInfo, ActionTypes } from "@/lib/adminLogger";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const { ipAddress, userAgent } = getRequestInfo(request);

    // Login admin
    const admin = await loginAdmin(username, password);

    // Log activity (async, don't wait)
    logAdminActivity({
      userId: admin.id,
      actionType: ActionTypes.LOGIN,
      resourceType: "ADMIN_PROFILE",
      resourceId: admin.id,
      description: `Admin login: ${admin.username}`,
      ipAddress,
      userAgent,
    }).catch(console.error); // Don't block login if logging fails

    // Return admin data (will be stored in session/cookie)
    return NextResponse.json({
      message: "Login berhasil",
      data: admin,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error?.message || "Login gagal" },
      { status: 401 }
    );
  }
}

