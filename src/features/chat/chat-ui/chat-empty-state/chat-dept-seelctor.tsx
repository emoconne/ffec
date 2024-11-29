import { FC } from "react";
import { ChatDoc } from "../../chat-services/models";
import { useChatContext } from "../chat-context";
import { useSession } from "next-auth/react";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Prop {
  disable: boolean;
}

const chatDocLabels: Record<ChatDoc, string> = {
  all: "すべての情報",
  it: "リスク・CD",
  hr: "自治体関連",
  fi: "安全管理基準",
  sales: "その他"
};

export const ChatDeptSelector: FC<Prop> = (props) => {
  const { data: session } = useSession();
  const { chatBody, onChatDocChange } = useChatContext();

  return (
    <FormControl>
      <RadioGroup
        row
        aria-labelledby="dept-group-label"
        defaultValue="all"
        name="radio-buttons-group"
        className="justify-end"
        onChange={(event) => onChatDocChange(event.target.value as ChatDoc)}
      >
        <FormControlLabel
          value="all"
          control={<Radio />}
          label={<span className="text-sm text-muted-foreground">すべて</span>}
        />
        <FormControlLabel
          value="it"
          control={<Radio />}
          label={<span className="text-sm text-muted-foreground">リスク・CD</span>}
        />
        <FormControlLabel
          value="hr"
          control={<Radio />}
          label={<span className="text-sm text-muted-foreground">自治体関連</span>}
        />
        <FormControlLabel
          value="fi"
          control={<Radio />}
          label={<span className="text-sm text-muted-foreground">安全管理基準</span>}
        />
      </RadioGroup>
      <div className="mt-2 text-center text-sm text-gray-600">
        {chatDocLabels[chatBody.chatDoc]}からデータを検索します
      </div>
    </FormControl>
  );
};