import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { student_uid, pin, term_id } = await req.json()

    if (!student_uid || typeof student_uid !== 'string' || student_uid.length > 100) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid student_uid' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!term_id || typeof term_id !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid term_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find student by UID
    const { data: student, error: studErr } = await supabaseAdmin
      .from('students')
      .select('id, full_name, name_en, name_ar, student_uid, class_level_id, class_arm_id, gender')
      .eq('student_uid', student_uid)
      .maybeSingle()

    if (studErr) {
      return new Response(JSON.stringify({ ok: false, error: 'Database error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!student) {
      return new Response(JSON.stringify({ ok: false, error: 'Student not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // If a PIN record exists for this student+term, require correct pin
    const { data: pinRec, error: pinErr } = await supabaseAdmin
      .from('pins')
      .select('id, pin')
      .eq('student_id', student.id)
      .eq('term_id', term_id)
      .maybeSingle()

    if (pinErr) {
      return new Response(JSON.stringify({ ok: false, error: 'Database error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (pinRec) {
      if (!pin || pin !== pinRec.pin) {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid PIN' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // Fetch term
    const { data: term } = await supabaseAdmin.from('terms').select('*').eq('id', term_id).maybeSingle()

    // Fetch subjects for the student's class level
    const { data: subjects } = await supabaseAdmin.from('subjects').select('*').eq('class_level_id', student.class_level_id).order('id')

    // Fetch term scores for this student and term
    const { data: scores } = await supabaseAdmin.from('term_scores').select('*').eq('student_id', student.id).eq('term_id', term_id)

    // Fetch any saved teacher/head remarks and signatures
    const { data: report } = await supabaseAdmin.from('term_reports').select('*').eq('student_id', student.id).eq('term_id', term_id).maybeSingle()

    return new Response(JSON.stringify({ ok: true, student, term, subjects: subjects || [], scores: scores || [], report: report || null }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
