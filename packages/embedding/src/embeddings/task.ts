import { embed } from "ai";
import { stripHtml } from "string-strip-html";
import { EMBEDDING_MODEL, EMBEDDING_OPTIONS } from "../constants";

export const generateTaskEmbedding = async ({
  title,
  description,
}: {
  title: string;
  description?: string | null;
}) => {
  const cleanTitle = stripHtml(title).result;
  const cleanDescription = description
    ? stripHtml(description).result
    : undefined;
  const value = [cleanTitle, cleanDescription].filter(Boolean).join("\n");

  const embedding = await embed({
    model: EMBEDDING_MODEL,
    value,
    providerOptions: EMBEDDING_OPTIONS,
  });

  return {
    embedding: embedding.embedding,
    model: EMBEDDING_MODEL,
  };
};
