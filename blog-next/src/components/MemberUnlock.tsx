'use client'

import { useState, useEffect } from 'react'

interface MemberUnlockProps {
  targetId: string
}

export default function MemberUnlock({ targetId }: MemberUnlockProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    const isUnlocked = localStorage.getItem('member_verified') === 'true'
    if (isUnlocked) setUnlocked(true)
  }, [])

  if (unlocked) return null

  return (
    <div className="mt-4">
      {showInput ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (password === 'vip2026') {
              localStorage.setItem('member_verified', 'true')
              setUnlocked(true)
            } else {
              setError(true)
              setPassword('')
            }
          }}
          className="flex gap-2"
        >
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="输入会员密码"
            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-amber-500 text-white rounded text-sm hover:bg-amber-600"
          >
            解锁
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm hover:bg-amber-200 transition-colors"
        >
          🔓 解锁会员内容
        </button>
      )}
      {error && <p className="text-red-500 text-xs mt-1">密码错误，请重试</p>}
    </div>
  )
}
