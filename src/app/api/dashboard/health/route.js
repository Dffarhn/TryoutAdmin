import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * GET /api/dashboard/health
 * Get health check warnings
 */
export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const warnings = [];

    // Check tryouts without sub-chapters
    const { data: tryoutsData, error: tryoutsError } = await supabase
      .from("tryouts")
      .select("id, title, package_id");
    if (tryoutsError) throw tryoutsError;

    const { data: subChaptersData, error: subChaptersError } = await supabase
      .from("sub_chapters")
      .select("tryout_id");
    if (subChaptersError) throw subChaptersError;

    const tryoutsWithSubChapters = new Set(
      (subChaptersData || []).map((sc) => sc.tryout_id)
    );
    const tryoutsWithoutSubChapters = (tryoutsData || []).filter(
      (t) => !tryoutsWithSubChapters.has(t.id)
    );

    if (tryoutsWithoutSubChapters.length > 0) {
      warnings.push({
        type: "tryout_no_subchapters",
        message: `${tryoutsWithoutSubChapters.length} tryout tanpa sub-bab`,
        count: tryoutsWithoutSubChapters.length,
        tryoutIds: tryoutsWithoutSubChapters.map((t) => t.id),
        tryoutTitles: tryoutsWithoutSubChapters.map((t) => t.title),
      });
    }

    // Check tryouts without questions (via question_sub_chapters)
    const { data: questionSubChaptersData, error: qscError } = await supabase
      .from("question_sub_chapters")
      .select("sub_chapter_id, sub_chapters(tryout_id)");
    if (qscError) throw qscError;

    const tryoutsWithQuestions = new Set();
    (questionSubChaptersData || []).forEach((qsc) => {
      if (qsc.sub_chapters?.tryout_id) {
        tryoutsWithQuestions.add(qsc.sub_chapters.tryout_id);
      }
    });

    const tryoutsWithoutQuestions = (tryoutsData || []).filter(
      (t) => !tryoutsWithQuestions.has(t.id)
    );

    if (tryoutsWithoutQuestions.length > 0) {
      warnings.push({
        type: "tryout_no_questions",
        message: `${tryoutsWithoutQuestions.length} tryout tanpa soal`,
        count: tryoutsWithoutQuestions.length,
        tryoutIds: tryoutsWithoutQuestions.map((t) => t.id),
        tryoutTitles: tryoutsWithoutQuestions.map((t) => t.title),
      });
    }

    // Check packages without tryouts
    const { data: packagesData, error: packagesError } = await supabase
      .from("packages")
      .select("id, name");
    if (packagesError) throw packagesError;

    const tryoutPackageIds = new Set(
      (tryoutsData || []).map((t) => t.package_id).filter(Boolean)
    );
    const packagesWithoutTryouts = (packagesData || []).filter(
      (p) => !tryoutPackageIds.has(p.id)
    );

    if (packagesWithoutTryouts.length > 0) {
      warnings.push({
        type: "package_no_tryouts",
        message: `${packagesWithoutTryouts.length} paket tanpa tryout`,
        count: packagesWithoutTryouts.length,
        packageIds: packagesWithoutTryouts.map((p) => p.id),
        packageNames: packagesWithoutTryouts.map((p) => p.name),
      });
    }

    // Check questions without category
    const { count: questionsWithoutCategory, error: questionsError } =
      await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .is("category_id", null);
    if (questionsError) throw questionsError;

    if (questionsWithoutCategory > 0) {
      warnings.push({
        type: "questions_no_category",
        message: `${questionsWithoutCategory} soal tanpa kategori`,
        count: questionsWithoutCategory,
      });
    }

    return NextResponse.json({ data: { warnings } });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

