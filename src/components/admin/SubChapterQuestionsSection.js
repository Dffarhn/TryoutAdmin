"use client";

import { useState } from "react";
import Link from "next/link";
import { useSubChapterQuestions } from "@/hooks/useQuestionSubChapters";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

export function SubChapterQuestionsSection({
  tryoutId,
  subChapter,
  isExpanded,
  onToggle,
  onRemoveQuestion,
}) {
  const { data: questions = [], isLoading } = useSubChapterQuestions(
    tryoutId,
    subChapter.id
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggle}
              className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors"
            >
              {isExpanded ? "▼" : "▶"} {subChapter.categoryName || subChapter.name || "Sub-Bab"}
            </button>
            <span className="text-sm text-gray-500">
              ({questions.length} soal)
            </span>
          </div>
          <Link
            href={`/admin/tryouts/${tryoutId}/sub-chapters/${subChapter.id}/questions/assign`}
          >
            <Button variant="secondary" className="text-xs">
              + Assign Soal
            </Button>
          </Link>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {isLoading ? (
            <p className="text-gray-600">Memuat soal...</p>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Belum ada soal di sub-bab ini</p>
              <Link
                href={`/admin/tryouts/${tryoutId}/sub-chapters/${subChapter.id}/questions/assign`}
              >
                <Button variant="secondary">Assign Soal</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Urutan</TableHead>
                  <TableHead>Soal</TableHead>
                  <TableHead>Opsi Jawaban</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="font-medium">
                        {question.orderIndex + 1}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {question.text}
                          </p>
                          {question.explanation && (
                            <p className="text-xs text-gray-500 mt-1">
                              Penjelasan tersedia
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {question.answerOptions?.length || 0} opsi
                          {question.correctAnswerOptionId && " • Ada jawaban benar"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="danger"
                          className="text-xs px-3 py-1.5"
                          onClick={() =>
                            onRemoveQuestion(
                              subChapter.id,
                              question.questionSubChapterId,
                              question.text
                            )
                          }
                        >
                          Hapus dari Sub-Bab
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

