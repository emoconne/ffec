"use server";

import { simpleSearch } from "@/features/chat/chat-services/azure-cog-search/azure-cog-vector-store";

// UTF-8のみを想定した安全なテキスト処理関数
function sanitizeUTF8Text(text: string | null | undefined): string {
  if (text == null) return '';
  
  try {
    // UTF-8として安全に処理
    return text
      .replace(/\uFFFD/g, '')      // 置換文字を削除
      .replace(/�/g, '')           // 不明な文字を削除
      .trim();                     // 前後の空白を削除
  } catch (error) {
    console.error('Text sanitization error:', error);
    return '';
  }
}

export const CitationAction = async (
  previousState: any,
  formData: FormData
) => {
  const result = await simpleSearch({
    filter: `id eq '${formData.get("id")}'`,
  });

  if (result.length === 0) return <div>Not found</div>;

  const firstResult = result[0];

  // UTF-8テキストをサニタイズ
  const sanitizedPageContent = sanitizeUTF8Text(firstResult.pageContent);
  const sanitizedSource = sanitizeUTF8Text(firstResult.source);
  const sanitizedId = sanitizeUTF8Text(firstResult.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="whitespace-pre-wrap">{sanitizedPageContent}</div>
    </div>
  );
};