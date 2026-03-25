import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/upload - Upload image to Supabase Storage
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const formData = await request.formData()
  const file = formData.get('file') as File
  const type = formData.get('type') as string // 'question' or 'option'
  const quizId = formData.get('quizId') as string || 'temp'
  const questionId = formData.get('questionId') as string || 'unknown'
  const optionId = formData.get('optionId') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file type and size
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Supported: JPG, PNG, GIF, WebP' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  // Generate file path
  const ext = file.name.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const path = type === 'question'
    ? `questions/${quizId}/${questionId}_${timestamp}.${ext}`
    : `options/${quizId}/${questionId}/${optionId || 'unknown'}_${timestamp}.${ext}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('quiz-images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('quiz-images')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
