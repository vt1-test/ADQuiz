import Link from "next/link";
import AuthForm from "@/app/auth-form";

export const metadata = {
  title: "Sign up — Quiz Quest",
  description: "Create a Quiz Quest account with Google or email.",
};

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-5 py-12">
      <div className="rounded-2xl bg-white/[0.04] p-8 ring-1 ring-white/10">
        <h1 className="text-2xl font-bold text-white">Create an account</h1>
        <p className="mt-2 text-sm text-slate-400">Sign up to save your results and track your progress.</p>
        <div className="mt-8">
          <AuthForm mode="signup" />
        </div>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
