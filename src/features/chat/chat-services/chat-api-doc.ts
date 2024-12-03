import { userHashedId } from "@/features/auth/helpers";
import { OpenAIInstance } from "@/features/common/openai";
import { AI_NAME } from "@/features/theme/customise";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { similaritySearchVectorWithScore } from "./azure-cog-search/azure-cog-vector-store";
import { initAndGuardChatSession } from "./chat-thread-service";
import { CosmosDBChatMessageHistory } from "./cosmosdb/cosmosdb";
import { PromptGPTProps , ChatDoc} from "./models";

const SYSTEM_PROMPT = `あなたは ${AI_NAME}です。ユーザーからの質問に対して日本語で丁寧に回答します。 \n`;

const CONTEXT_PROMPT = ({
  context,
  userQuestion,
  citations
}: {
  context: string;
  userQuestion: string;
  citations: Array<{name: string, id: string}>
}) => {
  return ` - Given the following extracted parts of a long document, create a final answer. \n
  - If you don't know the answer, just say that you don't know. Don't try to make up an answer.\n
  - You must always include a citation at the end of your answer.\n
  - Use exactly this format for citation: {%citation items=[${citations.map(c => `{name:"${c.name}",id:"${c.id}"}`).join(',')}]/%}\n
  ----------------\n
  context:\n
  ${context}
  ----------------\n
  question: ${userQuestion}`;
};

export const ChatAPIDoc = async (props: PromptGPTProps) => {
  const { lastHumanMessage, id, chatThread } = await initAndGuardChatSession(
    props
  );

  const openAI = OpenAIInstance();

  const userId = await userHashedId();

  let chatAPIModel = "";
  if (props.chatAPIModel === "GPT-3") {
    chatAPIModel = "gpt-35-turbo-16k";
  } else {
    chatAPIModel = "gpt-4o";
  }
  chatAPIModel = "gpt-4o-mini";

  let chatDoc = props.chatDoc;

  const chatHistory = new CosmosDBChatMessageHistory({
    sessionId: chatThread.id,
    userId: userId,
  });

  const history = await chatHistory.getMessages();
  const topHistory = history.slice(history.length - 30, history.length);

  const relevantDocuments = await findRelevantDocuments(
    lastHumanMessage.content,
    chatDoc
  );

  const context = relevantDocuments
    .map((result, index) => {
      const content = result.pageContent.replace(/(\r\n|\n|\r)/gm, "");
      return `[${index + 1}]. ${content}`;
    })
    .join("\n------\n");

  const citations = relevantDocuments.map((result) => ({
    name: result.source,
    id: result.id
  }));

  try {
    const response = await openAI.chat.completions.create({
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...topHistory,
        {
          role: "user",
          content: CONTEXT_PROMPT({
            context,
            userQuestion: lastHumanMessage.content,
            citations: citations
          }),
        },
      ],
      model: chatAPIModel,
      stream: true,
    });

    const stream = OpenAIStream(response, {
      async onCompletion(completion) {
        await chatHistory.addMessage({
          content: lastHumanMessage.content,
          role: "user",
        });

        await chatHistory.addMessage(
          {
            content: completion,
            role: "assistant",
          },
          context
        );
      },
    });

    return new StreamingTextResponse(stream);
  } catch (e: unknown) {
    if (e instanceof Error) {
      return new Response(e.message, {
        status: 500,
        statusText: e.toString(),
      });
    } else {
      return new Response("An unknown error occurred.", {
        status: 500,
        statusText: "Unknown Error",
      });
    }
  }
};

const findRelevantDocuments = async (query: string, chatDoc: string) => {
  const filter = chatDoc === 'all' 
    ? "chatType eq 'doc'"
    : `chatType eq 'doc' and deptName eq '${chatDoc}'`;

  const relevantDocuments = await similaritySearchVectorWithScore(query, 10, {
    filter: filter,
  });
  return relevantDocuments;
};