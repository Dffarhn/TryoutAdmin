import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { google } from "npm:googleapis@126.0.1";
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    // Ambil body (multipart form data)
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify({
        error: "No file uploaded"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Validasi ukuran file (max 10 MB)
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        error: "File size exceeds 10 MB limit"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Validasi tipe file (hanya gambar - file sudah dikompres di Next.js)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif"
    ];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        error: "Invalid file type. Only images are allowed"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Convert file ke buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    // Setup Google Drive auth dengan OAuth 2.0
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");
    
    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error("GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, dan GOOGLE_REFRESH_TOKEN harus di-set di environment variables");
    }
    
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "urn:ietf:wg:oauth:2.0:oob" // Redirect URI untuk OAuth (tidak digunakan untuk refresh token)
    );
    
    // Set refresh token untuk mendapatkan access token
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    const drive = google.drive({
      version: "v3",
      auth: oauth2Client
    });
    
    // Gunakan folder ID dari environment variable
    const folderIdFromEnv = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID");
    const folderName = "soal-tryout";
    let folderId = folderIdFromEnv ?? null;

    if (!folderId) {
      // Fallback: cari folder di My Drive service account, atau buat jika belum ada
      const folderSearch = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id, name)",
        pageSize: 1
      });
      if (folderSearch.data.files && folderSearch.data.files.length > 0) {
        folderId = folderSearch.data.files[0].id!;
      } else {
        const folderCreate = await drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: "application/vnd.google-apps.folder"
          },
          fields: "id, name"
        });
        folderId = folderCreate.data.id!;
        try {
          await drive.permissions.create({
            fileId: folderId,
            requestBody: { role: "reader", type: "anyone" }
          });
        } catch (permError) {
          console.warn("Failed to make folder public:", permError);
        }
      }
    }
    // Generate unique filename dengan timestamp
    const timestamp = Date.now();
    const originalName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    // Gunakan extension sesuai mimeType file yang di-upload
    const extension = file.type.includes("webp") ? "webp" : file.type.includes("jpeg") || file.type.includes("jpg") ? "jpg" : file.type.includes("png") ? "png" : file.type.includes("gif") ? "gif" : "webp"; // default
    const fileName = `${originalName}_${timestamp}.${extension}`;
    // Convert Buffer to Node.js Readable stream
    // Wrap in array to pass as a single chunk instead of iterating over bytes
    const nodeStream = Readable.from([
      fileBuffer
    ]);
    // Upload file ke Google Drive di dalam folder "soal-tryout"
    const uploadResponse = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: file.type,
        parents: folderId ? [
          folderId
        ] : undefined
      },
      media: {
        mimeType: file.type,
        body: nodeStream
      },
      fields: "id, name, webViewLink, webContentLink, thumbnailLink"
    });
    const fileId = uploadResponse.data.id;
    // Buat file public (optional - bisa di-disable kalau mau private)
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone"
        }
      });
    } catch (permError) {
      console.warn("Failed to make file public:", permError);
    // Continue anyway, file masih bisa diakses via webContentLink
    }
    // Get public URL
    const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    return new Response(JSON.stringify({
      success: true,
      id: fileId,
      name: uploadResponse.data.name,
      webViewLink: uploadResponse.data.webViewLink,
      webContentLink: uploadResponse.data.webContentLink,
      publicUrl: publicUrl,
      directUrl: directUrl,
      thumbnailLink: uploadResponse.data.thumbnailLink,
      size: fileBuffer.length,
      originalSize: file.size
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(JSON.stringify({
      error: err.message || "Internal server error",
      details: err.toString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
