import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/drafts - List all drafts
export async function GET() {
  const supabase = await createClient()

  const { data: drafts, error } = await supabase
    .from('quiz_drafts')
    .select('id, title, questions, current_step, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const draftsWithCount = (drafts || []).map((d) => {
    const draftData = d as Record<string, unknown>
    return {
      id: draftData.id,
      _id: draftData.id, // For compatibility with existing frontend
      title: draftData.title,
      questionCount: (draftData.questions as unknown[]).length,
      currentStep: draftData.current_step,
      createdAt: draftData.created_at,
      updatedAt: draftData.updated_at,
    }
  })

  return NextResponse.json(draftsWithCount)
}

// POST /api/drafts - Create or update draft
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  // Handle both _id (from frontend) and id
  const draftId = body._id || body.id

  if (draftId) {
    // Update existing draft
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: draft, error } = await (supabase as any)
      .from('quiz_drafts')
      .update({
        title: body.title || 'Untitled Quiz',
        description: body.description || '',
        time_limit: body.timeLimit || null,
        tags: body.tags || [],
        auto_generate_share_code: body.autoGenerateShareCode ?? true,
        questions: body.questions || [],
        current_step: body.currentStep || 1,
      })
      .eq('id', draftId)
      .select()
      .single()

    if (error) {
      // If not found, create new
      if (error.code === 'PGRST116') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newDraft, error: insertError } = await (supabase as any)
          .from('quiz_drafts')
          .insert({
            title: body.title || 'Untitled Quiz',
            description: body.description || '',
            time_limit: body.timeLimit || null,
            tags: body.tags || [],
            auto_generate_share_code: body.autoGenerateShareCode ?? true,
            questions: body.questions || [],
            current_step: body.currentStep || 1,
          })
          .select()
          .single()

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        const newDraftData = newDraft as Record<string, unknown>
        return NextResponse.json({
          ...newDraftData,
          _id: newDraftData.id,
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const draftData = draft as Record<string, unknown>
    return NextResponse.json({
      ...draftData,
      _id: draftData.id,
    })
  } else {
    // Create new draft
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: draft, error } = await (supabase as any)
      .from('quiz_drafts')
      .insert({
        title: body.title || 'Untitled Quiz',
        description: body.description || '',
        time_limit: body.timeLimit || null,
        tags: body.tags || [],
        auto_generate_share_code: body.autoGenerateShareCode ?? true,
        questions: body.questions || [],
        current_step: body.currentStep || 1,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const draftData = draft as Record<string, unknown>
    return NextResponse.json({
      ...draftData,
      _id: draftData.id,
    })
  }
}
