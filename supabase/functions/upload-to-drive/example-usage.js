/**
 * Contoh penggunaan Edge Function Upload to Google Drive
 * 
 * File ini berisi contoh implementasi untuk berbagai platform
 */

// ============================================
// 1. JavaScript/TypeScript (Next.js/React)
// ============================================

/**
 * Upload file ke Google Drive via Supabase Edge Function
 * @param {File} file - File yang akan di-upload
 * @param {string} supabaseUrl - URL Supabase project
 * @param {string} supabaseAnonKey - Supabase anonymous key
 * @returns {Promise<Object>} Response dari Edge Function
 */
export async function uploadToDrive(file, supabaseUrl, supabaseAnonKey) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/upload-to-drive`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

// Contoh penggunaan di React Component
/*
import { useState } from 'react';

function ImageUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadToDrive(
        file,
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      
      setUploadedUrl(result.publicUrl);
      console.log('Upload success:', result);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload gagal: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {uploadedUrl && (
        <img src={uploadedUrl} alt="Uploaded" style={{ maxWidth: '300px' }} />
      )}
    </div>
  );
}
*/

// ============================================
// 2. Flutter (Dart)
// ============================================

/*
import 'package:http/http.dart' as http;
import 'dart:io';
import 'dart:convert';

Future<Map<String, dynamic>> uploadToDriveFlutter(File imageFile) async {
  try {
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('https://<project-ref>.functions.supabase.co/upload-to-drive'),
    );

    // Add headers
    request.headers['Authorization'] = 'Bearer <your-supabase-anon-key>';
    request.headers['apikey'] = '<your-supabase-anon-key>';

    // Add file
    request.files.add(
      await http.MultipartFile.fromPath('file', imageFile.path),
    );

    // Send request
    var streamedResponse = await request.send();
    var response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      var error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Upload failed');
    }
  } catch (e) {
    print('Upload error: $e');
    rethrow;
  }
}

// Contoh penggunaan di Flutter Widget
/*
class ImageUploadWidget extends StatefulWidget {
  @override
  _ImageUploadWidgetState createState() => _ImageUploadWidgetState();
}

class _ImageUploadWidgetState extends State<ImageUploadWidget> {
  bool _uploading = false;
  String? _uploadedUrl;

  Future<void> _pickAndUploadImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile == null) return;

    setState(() => _uploading = true);

    try {
      final file = File(pickedFile.path);
      final result = await uploadToDriveFlutter(file);
      
      setState(() {
        _uploadedUrl = result['publicUrl'];
        _uploading = false;
      });
    } catch (e) {
      setState(() => _uploading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Upload gagal: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ElevatedButton(
          onPressed: _uploading ? null : _pickAndUploadImage,
          child: Text(_uploading ? 'Uploading...' : 'Upload Image'),
        ),
        if (_uploadedUrl != null)
          Image.network(_uploadedUrl!),
      ],
    );
  }
}
*/

// ============================================
// 3. React Native (Expo)
// ============================================

/*
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

async function uploadToDriveReactNative() {
  try {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission denied');
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Create form data
    const formData = new FormData();
    formData.append('file', {
      uri,
      type,
      name: filename,
    });

    // Upload
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/upload-to-drive`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
*/

// ============================================
// 4. Vanilla JavaScript (HTML)
// ============================================

/*
<!DOCTYPE html>
<html>
<head>
  <title>Upload to Google Drive</title>
</head>
<body>
  <input type="file" id="fileInput" accept="image/*" />
  <button onclick="handleUpload()">Upload</button>
  <div id="result"></div>

  <script>
    const SUPABASE_URL = 'https://<project-ref>.supabase.co';
    const SUPABASE_ANON_KEY = '<your-anon-key>';

    async function handleUpload() {
      const fileInput = document.getElementById('fileInput');
      const file = fileInput.files[0];
      
      if (!file) {
        alert('Pilih file terlebih dahulu');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/upload-to-drive`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              apikey: SUPABASE_ANON_KEY,
            },
            body: formData,
          }
        );

        const data = await response.json();
        
        if (data.success) {
          document.getElementById('result').innerHTML = `
            <p>Upload berhasil!</p>
            <img src="${data.publicUrl}" alt="Uploaded" style="max-width: 300px;" />
            <p>URL: <a href="${data.publicUrl}" target="_blank">${data.publicUrl}</a></p>
          `;
        } else {
          alert('Upload gagal: ' + data.error);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Upload gagal: ' + error.message);
      }
    }
  </script>
</body>
</html>
*/

