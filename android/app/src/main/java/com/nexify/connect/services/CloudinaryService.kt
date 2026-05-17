package com.nexify.connect.services

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.InputStream

object CloudinaryService {
    private val client = OkHttpClient()
    
    // Nexify Connect global demo cloud credentials for seamless integration
    private const val CLOUD_NAME = "nexify-connect" 
    private const val UPLOAD_PRESET = "unsigned_preset"

    /**
     * Compresses the selected image Uri and uploads it to Cloudinary.
     * Returns the secure HTTPS URL on success.
     */
    suspend fun uploadImage(context: Context, imageUri: Uri): String = withContext(Dispatchers.IO) {
        val bytes = compressUri(context, imageUri) ?: throw Exception("Failed to compress image source.")
        
        val requestBody = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("upload_preset", UPLOAD_PRESET)
            .addFormDataPart("file", "upload_${System.currentTimeMillis()}.jpg", bytes.toRequestBody("image/jpeg".toMediaType()))
            .build()

        val request = Request.Builder()
            .url("https://api.cloudinary.com/v1_1/$CLOUD_NAME/image/upload")
            .post(requestBody)
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw Exception("Upload to Cloudinary failed: ${response.message}")
            val body = response.body?.string() ?: throw Exception("Empty response from media gateway.")
            val json = JSONObject(body)
            json.getString("secure_url")
        }
    }

    /**
     * Reads image Uri stream, resizes to a max boundary of 1024px to save storage,
     * and compresses using JPEG 75% quality.
     */
    private fun compressUri(context: Context, uri: Uri): ByteArray? {
        var inputStream: InputStream? = null
        return try {
            inputStream = context.contentResolver.openInputStream(uri)
            val originalBitmap = BitmapFactory.decodeStream(inputStream) ?: return null
            
            val maxDimension = 1024
            val scaledBitmap = if (originalBitmap.width > maxDimension || originalBitmap.height > maxDimension) {
                val ratio = originalBitmap.width.toFloat() / originalBitmap.height.toFloat()
                val newWidth = if (ratio > 1) maxDimension else (maxDimension * ratio).toInt()
                val newHeight = if (ratio > 1) (maxDimension / ratio).toInt() else maxDimension
                Bitmap.createScaledBitmap(originalBitmap, newWidth, newHeight, true)
            } else {
                originalBitmap
            }

            val outputStream = ByteArrayOutputStream()
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 75, outputStream)
            outputStream.toByteArray()
        } catch (e: Exception) {
            e.printStackTrace()
            null
        } finally {
            inputStream?.close()
        }
    }
}
