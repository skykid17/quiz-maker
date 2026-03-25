import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/drafts - List all drafts owned by current user
export async function GET() {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query only current user's drafts
    const { data: drafts, error } = await supabase
      .from('quiz_drafts')
      .select('id, title, questions, current_step, created_at, updated_at, user_id')
      .eq('user_id', user.id)
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch drafts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/drafts - Create or update draft owned by current user
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Handle both _id (from frontend) and id
    const draftId = body._id || body.id

    if (draftId) {
      try {
        // Verify user owns this draft
        const { data: existingDraft, error: checkError } = await supabase
          .from('quiz_drafts')
          .select('id')
          .eq('id', draftId)
          .eq('user_id', user.id)
          .single()

        if (checkError || !existingDraft) {
          return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
        }

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
          .eq('user_id', user.id)
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
      } catch (err) {
        // If draft not found, create new
        // Fall through to create logic below
      }
    }

    // Create new draft
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: draft, error } = await (supabase as any)
      .from('quiz_drafts')
      .insert({
        user_id: user.id,
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save draft'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
