
// import { NextRequest, NextResponse } from "next/server";
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// const s3 = new S3Client({
//   region: process.env.AWS_REGION!,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//   },
// });

// export async function POST(req: NextRequest) {
//   console.log("[UPLOAD] Incoming request...");

//   const formData = await req.formData();
//   const file = formData.get("file") as File | null;

//   if (!file) {
//     console.warn("[UPLOAD] No file received");
//     return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//   }

//   const arrayBuffer =
//   typeof (file as any).arrayBuffer === "function"
//     ? await (file as any).arrayBuffer()
//     : Buffer.isBuffer(file)
//     ? file
//     : Buffer.from(await (file as any).text(), "binary");

//   const buffer = Buffer.from(arrayBuffer);

//   const key = `CRM/${Date.now()}-${file.name}`;
//   const uploadParams = {
//     Bucket: process.env.AWS_S3_BUCKET!,
//     Key: key,
//     Body: buffer,
//     ContentType: file.type,
//   };

//   console.log(`[UPLOAD] Uploading to S3: ${key} (${file.size} bytes)`);

//   try {
//     await s3.send(new PutObjectCommand(uploadParams));

//     const publicUrl = `https://${process.env.AWS_S3_BUCKET!}.s3.${process.env.AWS_REGION!}.amazonaws.com/${key}`;

//     console.log(`[UPLOAD] Success: ${key}`);
//     return NextResponse.json({
//       message: "Uploaded successfully!",
//       key,
//       publicUrl
//     });
    
//   } catch (err: any) {
//     console.error("[UPLOAD] Failed:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }












// app/api/resumes/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: NextRequest) {
  console.log("[UPLOAD API] Starting upload process...");
  
  try {
    // 1. Check if environment variables are set
    const requiredEnvVars = [
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID', 
      'AWS_SECRET_ACCESS_KEY',
      'AWS_S3_BUCKET'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingEnvVars.length > 0) {
      console.error("[UPLOAD API] Missing environment variables:", missingEnvVars);
      return NextResponse.json(
        { error: `Missing environment variables: ${missingEnvVars.join(', ')}` },
        { status: 500 }
      );
    }
    
    console.log("[UPLOAD API] Environment variables check passed");

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const leadId = formData.get("lead_id") as string | null;

    console.log("[UPLOAD API] File received:", file?.name);
    console.log("[UPLOAD API] Lead ID:", leadId);

    if (!file) {
      console.warn("[UPLOAD API] No file received");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!leadId) {
      console.warn("[UPLOAD API] No lead_id provided");
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    // 3. Validate file
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    console.log("[UPLOAD API] File validation passed");

    // 4. Prepare file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log("[UPLOAD API] File buffer created, size:", buffer.length, "bytes");

    // 5. Generate filename format: CRM/{lead_id}-{DDMMYYYY}-{HHMM}-{cleaned-filename}.pdf
    const now = new Date();
    
    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}${month}${year}`;
    };

    const formatTime = (date: Date): string => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}${minutes}`;
    };

    const datePart = formatDate(now);
    const timePart = formatTime(now);
    
    // Clean the original filename
    const cleanFileName = file.name
      .replace(/[^a-zA-Z0-9\-_.]/g, '-')
      .replace(/-+/g, '-')
      .replace(/\.pdf$/i, '')
      .toLowerCase();

    // Create S3 key
    const key = `CRM/${leadId}-${datePart}-${timePart}-${cleanFileName}.pdf`;
    
    console.log("[UPLOAD API] Generated S3 key:", key);

    // 6. Initialize S3 client
    console.log("[UPLOAD API] Initializing S3 client...");
    console.log("[UPLOAD API] AWS Region:", process.env.AWS_REGION);
    console.log("[UPLOAD API] S3 Bucket:", process.env.AWS_S3_BUCKET);
    
    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      // Add retry logic for debugging
      maxAttempts: 3,
    });

    // 7. Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
      // For testing, you can make it public (remove in production)
      // ACL: 'public-read',
    };

    console.log("[UPLOAD API] Uploading to S3...");
    console.log("[UPLOAD API] Upload params:", {
      Bucket: uploadParams.Bucket,
      Key: uploadParams.Key,
      ContentType: uploadParams.ContentType,
      BodySize: buffer.length
    });

    try {
      await s3.send(new PutObjectCommand(uploadParams));
      console.log("[UPLOAD API] S3 upload successful!");
    } catch (s3Error: any) {
      console.error("[UPLOAD API] S3 upload failed:", s3Error);
      console.error("[UPLOAD API] Error details:", {
        name: s3Error.name,
        message: s3Error.message,
        code: s3Error.Code,
        statusCode: s3Error.$metadata?.httpStatusCode
      });
      
      // Provide more specific error messages
      if (s3Error.name === 'CredentialsProviderError') {
        return NextResponse.json(
          { error: "AWS credentials are invalid or not configured properly" },
          { status: 500 }
        );
      } else if (s3Error.name === 'NoSuchBucket') {
        return NextResponse.json(
          { error: `S3 bucket '${uploadParams.Bucket}' does not exist` },
          { status: 500 }
        );
      } else if (s3Error.name === 'AccessDenied') {
        return NextResponse.json(
          { error: "Access denied to S3 bucket. Check IAM permissions." },
          { status: 500 }
        );
      }
      
      throw s3Error;
    }

    // 8. Generate public URL
    const publicUrl = `https://${process.env.AWS_S3_BUCKET!}.s3.${process.env.AWS_REGION!}.amazonaws.com/${key}`;
    
    console.log(`[UPLOAD API] Success! File uploaded to: ${key}`);
    console.log(`[UPLOAD API] Public URL: ${publicUrl}`);

    // 9. Return success response
    return NextResponse.json({
      message: "Uploaded successfully!",
      key,
      publicUrl,
      leadId,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: now.toISOString(),
    });
    
  } catch (err: any) {
    console.error("[UPLOAD API] Overall upload failed:", err);
    console.error("[UPLOAD API] Stack trace:", err.stack);
    
    return NextResponse.json(
      { 
        error: err.message || "Upload failed",
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
