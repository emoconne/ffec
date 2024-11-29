import { userHashedId } from "@/features/auth/helpers";
import { OpenAIInstance } from "@/features/common/openai";
import { AI_NAME } from "@/features/theme/customise";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { initAndGuardChatSession } from "./chat-thread-service";
import { CosmosDBChatMessageHistory } from "./cosmosdb/cosmosdb";
import { PromptGPTProps } from "./models";

export const ChatAPISimple = async (props: PromptGPTProps) => {
  // Destructure and initialize variables
  const { lastHumanMessage, chatThread } = await initAndGuardChatSession(props);
  const openAI = OpenAIInstance();
  const userId = await userHashedId();

  // Select appropriate model
  let chatAPIModel = props.chatAPIModel === "GPT-3" ? "gpt-35-turbo-16k" : "gpt-4o-mini";

  // Initialize chat history
  const chatHistory = new CosmosDBChatMessageHistory({
    sessionId: chatThread.id,
    userId: userId,
  });

  // Add user message to chat history
  await chatHistory.addMessage({
    content: lastHumanMessage.content,
    role: "user",
  });

  // Get recent chat history
  const history = await chatHistory.getMessages();
  const topHistory = history.slice(history.length - 30, history.length);

  try {
    // Create OpenAI chat completion
    const response = await openAI.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `あなたは ${AI_NAME} です。ユーザーからの質問に対して日本語で丁寧に回答します。
          - 質問には正直かつ正確に答えます。
          - 情報を分かりやすく説明します。
          - 必要に応じて簡潔で的確な回答を心がけます。`,
        },
        ...topHistory,
        {
          role: "user",
          content: lastHumanMessage.content,
        }
      ],
      model: chatAPIModel,
      stream: true,
      max_tokens: 2000, // Limit response length
      temperature: 0.7, // Balanced creativity and factuality
    });

    // Stream the response
    const stream = OpenAIStream(response, {
      async onCompletion(completion) {
        await chatHistory.addMessage({
          content: completion,
          role: "assistant",
        });
      },
    });

    return new StreamingTextResponse(stream);
    
  } catch (e: unknown) {
    // Error handling
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