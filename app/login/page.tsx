'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import { loginUser, clearError } from '@/store/slices/authSlice'
import { Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector(state => state.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (!email || !password) {
      setValidationError('Please fill in all fields')
      return
    }

    if (!email.includes('@')) {
      setValidationError('Please enter a valid email')
      return
    }

    const result = await dispatch(
      loginUser({ email, password }) as any
    )

    if (result.payload) {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">▶</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2 text-foreground">
            Welcome Back
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Sign in to your ChillHub account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="flex items-center border border-border rounded-lg bg-muted/50 px-4 py-2 focus-within:border-primary transition-colors">
                <Mail size={18} className="text-muted-foreground mr-2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="flex items-center border border-border rounded-lg bg-muted/50 px-4 py-2 focus-within:border-primary transition-colors">
                <Lock size={18} className="text-muted-foreground mr-2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Error Messages */}
            {(error || validationError) && (
              <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-3 text-sm">
                {error || validationError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-muted-foreground text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-primary font-semibold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              DEMO CREDENTIALS:
            </p>
            <p className="text-xs text-muted-foreground">
              Email: <code className="bg-background px-1 rounded">tech@example.com</code>
            </p>
            <p className="text-xs text-muted-foreground">
              Password: <code className="bg-background px-1 rounded">password</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
