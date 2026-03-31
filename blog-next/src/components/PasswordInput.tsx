'use client'

import { useState, useEffect } from 'react'

interface PasswordInputProps {
  onSuccess: () => void
  targetId?: string
}

export default function PasswordInput({ onSuccess, targetId }: PasswordInputProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    // 检查是否已解锁
    const isUnlocked = localStorage.getItem('member_verified') === 'true'
    if (isUnlocked) {
      onSuccess()
    }
  }, [onSuccess])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password === 'vip2026') {
      localStorage.setItem('member_verified', 'true')
      onSuccess()
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="bg-white rounded-lg p-8 shadow-md">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          {targetId ? '这篇是会员专属内容' : '输入会员密码解锁'}
        </h3>
        <p className="text-gray-500 text-sm">
          {targetId ? '成为会员后即可阅读全部内容' : '输入密码访问会员专区'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入会员密码"
            className={`w-full px-4 py-3 border rounded-lg text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">密码错误，请重试</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          解锁
        </button>
      </form>

      <p className="text-center text-gray-400 text-xs mt-6">
        会员密码获取请私信博主
      </p>
    </div>
  )
}
