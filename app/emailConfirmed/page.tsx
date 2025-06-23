// app/email-confirmed/page.tsx
export default function EmailConfirmed() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">✅ Email Verified</h1>
      <p className="text-gray-600 mt-2">Your email is now verified.</p>
      <a
        href="/"
        className="mt-6 text-blue-600 underline hover:text-blue-800"
      >
        Go to Login
      </a>
    </div>
  );
}
